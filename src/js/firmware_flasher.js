var jsonFile = require('jsonfile')
var jsonfileName = 'board.json'
var { loadRemoteJsonFile, loadRemoteFirmwareFile } = require('./src/js/firmware_flasherDownloader.js')
var { CRC16_Check, CRC16_Name } = require('./src/js/firmware_utils.js')
var { addBoarOption } = require('./src/js/utils.js')

const firmware_flasher = {
  localFirmwareLoaded       : false,
  selectedBoard             : undefined,
  boardNeedsVerification    : false,
  intel_hex                 : undefined, // standard intel hex in string format
  parsed_hex                : undefined, // parsed raw hex in array format
  unifiedTarget             : {}, // the Unified Target configuration to be spliced into the configuration
  isConfigLocal             : false, // Set to true if the user loads one locally
  developmentFirmwareLoaded : false, // Is the firmware to be flashed from the development branch?
  firmware_version          : {},
  target_board              : 0,
  flashFirmwareAck          : false,
}
var loadJsonFileFromGithubSuccessful = true
var loadFirmwareFromGithubSuccessful = true

firmware_flasher.FLASH_MESSAGE_TYPES = {
  NEUTRAL : 'NEUTRAL',
  VALID   : 'VALID',
  INVALID : 'INVALID',
  ACTION  : 'ACTION',
}

const { Console } = require('console')
const { CONNREFUSED } = require('dns')
const fs = require('fs')

let port = null
let binFile = null
let binFilePath = null
let packLen = 0

let strFileName = null
let lastSize = 0
let binSize = null
let packNum = 0
let ack = null
let starting = null
var flashTarget = {
  flightControl : 1,
  opticalFlow   : 3,
  OSD           : 5,
}
let currentflashTarget = null
var flashBoard = {
  Cetus      : 1,
  Cetus_pro  : 3,
  Lite_v3    : 5,
  Cetus_X    : 6,
  Cetus_X_HD : 7,
  Aquila16   : 8,
}

firmware_flasher.flashingMessage = function (message, type) {
  let self = this

  let progressLabel_e = $('span.progressLabel')
  switch (type) {
    case self.FLASH_MESSAGE_TYPES.VALID:
      progressLabel_e.removeClass('invalid actionRequired').addClass('valid')
      break
    case self.FLASH_MESSAGE_TYPES.INVALID:
      progressLabel_e.removeClass('valid actionRequired').addClass('invalid')
      break
    case self.FLASH_MESSAGE_TYPES.ACTION:
      progressLabel_e.removeClass('valid invalid').addClass('actionRequired')
      break
    case self.FLASH_MESSAGE_TYPES.NEUTRAL:
    default:
      progressLabel_e.removeClass('valid invalid actionRequired')
      break
  }
  if (message !== null) {
    progressLabel_e.html(message)
  }

  return self
}

firmware_flasher.enableFlashing = function (enabled, match) {
  if (enabled) {
    if (match == 1) {
      $('a.flash_firmware').removeClass('disabled')
    } else if (match == 3) {
      $('a.flash_opf').removeClass('disabled')
    } else if (match == 5) {
      $('a.flash_OSD').removeClass('disabled')
    }
  } else {
    if (match == 1) {
      $('a.flash_firmware').addClass('disabled')
    } else if (match == 3) {
      $('a.flash_opf').addClass('disabled')
    } else if (match == 5) {
      $('a.flash_OSD').addClass('disabled')
    }
  }
}

firmware_flasher.flashProgress = function (value) {
  $('.progress').val(value)
  return this
}

firmware_flasher.parseData = function (data) {
  if (data[0] == 67) {
    if (starting == 1) {
      var bufData = new Uint8Array(1029)
      packNumb = 0

      fs.open(binFilePath, 'r', function (err, fd) {
        if (err) {
          return console.error(err)
        }

        lastSize = binSize - 1024

        if (lastSize > 0) {
          bufData[0] = 0x02
          bufData[1] = 0
          bufData[2] = 255

          fs.read(fd, bufData, 3, 1024, 0, function (err, bytes) {
            if (err) {
              console.log(err)
            }

            CRC16_Check(bufData)

            if (bytes > 0) {
              port.write(bufData, (err) => {
                if (err) return console.log('write Error: ', err.message)
              })
              packNum++
            }
          })

          starting = 2
        }
      })
    }
  } else if (data[0] == 6) {
    if (starting == 2) {
      firmware_flasher.flashFirmwareAck = true
      var bufData = Buffer.alloc(1029)

      fs.open(binFilePath, 'r', function (err, fd) {
        if (err) {
          return console.error(err)
        }

        lastSize = binSize - packNum * 1024

        if (lastSize > 0) {
          bufData[0] = 0x02
          bufData[1] = packNum
          bufData[2] = ~packNum

          fs.read(fd, bufData, 3, 1024, packNum * 1024, function (err, bytes) {
            if (err) {
              console.log(err)
            }
            CRC16_Check(bufData)
            if (bytes > 0) {
              port.write(bufData, (err) => {
                if (err) return console.log('write Error: ', err.message)
              })
              packNum++
            }
          })

          if (lastSize < 1024) {
            starting = 3
          }
        }
      })

      firmware_flasher.flashingMessage('Flashing ...', firmware_flasher.FLASH_MESSAGE_TYPES.NEUTRAL)
      firmware_flasher.flashProgress((packNum / packLen) * 100)
    } else if (starting == 3) {
      var buf = Buffer.alloc(1)
      buf[0] = 0x04

      port.write(buf, (err) => {
        if (err) return console.log('write Error: ', err.message)
      })
      firmware_flasher.flashingMessage('Flash Finished', firmware_flasher.FLASH_MESSAGE_TYPES.NEUTRAL)
      firmware_flasher.flashProgress((packNum / packLen) * 100)

      $('a.load_file').removeClass('disabled')
      $('a.load_remote_file').removeClass('disabled')
      switch (currentflashTarget) {
        case flashTarget.flightControl:
          $('a.flash_firmware').removeClass('disabled')
          break
        case flashTarget.opticalFlow:
          $('a.flash_opf').removeClass('disabled')
          break
        case flashTarget.OSD:
          $('a.flash_OSD').removeClass('disabled')
          break
        default:
          break
      }
    }
  }
}

firmware_flasher.initialize = function (callback) {
  const self = this
  self.enableFlashing(false, 1)
  self.enableFlashing(false, 3)
  self.enableFlashing(false, 5)

  $('#content').load('./src/html/firmware_flasher.html', function () {
    i18n.localizePage()

    $('a.load_file').on('click', function () {
      self.enableFlashing(false, 1)
      self.enableFlashing(false, 3)
      self.enableFlashing(false, 5)
      dialog
        .showOpenDialog({
          title       : 'openFile',
          defaultPath : '',
          properties  : ['openFile', 'multiSelections'],
          filters     : [{ name: 'target files', extensions: ['bin'] }],
        })
        .then((result) => {
          binFilePath = result.filePaths[0]
          strFileName = binFilePath.substring(binFilePath.lastIndexOf('\\') + 1)

          fs.readFile(result.filePaths[0], (err, binFile) => {
            if (err) {
              alert(err)
            } else {
              binSize = binFile.length - 12
              var binSizeTemp = binFile.length

              if (binFile[binSizeTemp - 12] == 0x5a) {
                let targetID = binFile[binSizeTemp - 11]
                if (targetID == flashTarget.flightControl) {
                  $('#TargetID').text('   Flight Controller')
                  currentflashTarget = flashTarget.flightControl
                } else if (targetID == flashTarget.opticalFlow) {
                  $('#TargetID').text('   OpticalFlow Sensor')
                  currentflashTarget = flashTarget.opticalFlow
                } else if (targetID == flashTarget.OSD) {
                  $('#TargetID').text('   OSD')
                  currentflashTarget = flashTarget.OSD
                }
                let boardID = binFile[binSizeTemp - 10]
                if (boardID == flashBoard.Cetus) {
                  $('#BoardID').text('   Cetus')
                } else if (boardID == flashBoard.Cetus_pro) {
                  if (strFileName.includes('Cetus_pro_1.1.')) {
                    $('#BoardID').text(i18n.getMessage('cetus_pro_hardware_lt_1_2'))
                  } else if (strFileName.includes('Cetus_pro_1.2.')) {
                    $('#BoardID').text(i18n.getMessage('cetus_pro_hardware_gte_1_2'))
                  } else {
                    $('#BoardID').text('   Cetus Pro')
                  }
                } else if (boardID == flashBoard.Lite_v3) {
                  $('#BoardID').text('   Lite Brushed v3')
                } else if (boardID == flashBoard.Cetus_X) {
                  $('#BoardID').text('   Cetus X')
                } else if (boardID == flashBoard.Cetus_X_HD) {
                  $('#BoardID').text('   Cetus X HD')
                } else if (boardID == flashBoard.Cetus_2_Pro) {
                  $('#BoardID').text('   Aquila16')
                }

                var versionID = '  v' + binFile[binSizeTemp - 9] + '.' + binFile[binSizeTemp - 8] + '.' + binFile[binSizeTemp - 7]
                $('#VersionID').text(versionID)

                var dateID = '  ' + binFile[binSizeTemp - 6] + binFile[binSizeTemp - 5] + binFile[binSizeTemp - 4] + binFile[binSizeTemp - 3] + '-' + binFile[binSizeTemp - 2] + '-' + binFile[binSizeTemp - 1]
                $('#DateID').text(dateID)

                $('#FileID').text(strFileName)

                self.enableFlashing(true, targetID)
                packLen = Math.round(binSize / 1024)

                firmware_flasher.flashingMessage('Loaded Local Firmware : ( ' + binSize + 'bytes )', self.FLASH_MESSAGE_TYPES.NEUTRAL)
              } else {
                $('#FileID').text('Unrecognized firmware!')
                $('#TargetID').text('    ')
                $('#BoardID').text('   ')
                $('#VersionID').text(' ')
                $('#DateID').text(' ')
                firmware_flasher.flashingMessage('Failed to Load Firmware', self.FLASH_MESSAGE_TYPES.INVALID)
              }
            }
          })
        })
        .catch((err) => {
          console.log(err)
        })
    })

    $('a.flash_firmware').on('click', function () {
      if ($(this).hasClass('disabled')) {
        return
      }
      if (GUI.connect_lock) {
        //串口已连接
        packNum = 0
        var buf = Buffer.alloc(1)
        buf[0] = 0x01
        port.write(buf, (err) => {
          if (err) return console.log('write Error: ', err.message)
        })

        $('a.load_file').addClass('disabled')
        $('a.load_remote_file').addClass('disabled')

        firmware_flasher.flashProgress(0)
        self.enableFlashing(false, 1)

        starting = 1
        firmware_flasher.flashFirmwareAck = false
        setTimeout(() => {
          if (firmware_flasher.flashFirmwareAck == true) {
            //固件写入正常
          } else {
            //固件烧写没有收到飞控应答
            const options = {
              type      : 'warning',
              buttons   : [i18n.getMessage('Confirm')],
              defaultId : 0,
              title     : i18n.getMessage('Flash_failed'),
              message   : i18n.getMessage('Check_Serial_Port_and_enter_bootloader'),
              noLink    : true,
            }
            let WIN = getCurrentWindow()
            dialog.showMessageBoxSync(WIN, options)
            $('a.flash_firmware').removeClass('disabled')
            $('a.load_file').removeClass('disabled')
            $('a.load_remote_file').removeClass('disabled')
            port.close()
          }
        }, 3000)
      } else {
        //alert("please connect COM first");

        const options = {
          type      : 'warning',
          buttons   : [i18n.getMessage('Confirm')],
          defaultId : 0,
          title     : i18n.getMessage('warningTitle'),
          message   : i18n.getMessage('Connect_Serial_Port_Firstlt'),
          noLink    : true,
        }
        let WIN = getCurrentWindow()
        dialog.showMessageBoxSync(WIN, options)
      }
    })

    $('a.flash_opf').on('click', function () {
      if ($(this).hasClass('disabled')) {
        return
      }
      if (GUI.connect_lock) {
        //串口已连接
        packNum = 0
        var buf = Buffer.alloc(1)
        buf[0] = 0x03

        port.write(buf, (err) => {
          if (err) return console.log('write Error: ', err.message)
        })

        $('a.load_file').addClass('disabled')
        $('a.load_remote_file').addClass('disabled')

        firmware_flasher.flashProgress(0)
        self.enableFlashing(false, 3)

        starting = 1
        firmware_flasher.flashFirmwareAck = false
        setTimeout(() => {
          if (firmware_flasher.flashFirmwareAck == true) {
            //固件写入正常
          } else {
            //固件烧写没有收到飞控应答
            const options = {
              type      : 'warning',
              buttons   : [i18n.getMessage('Confirm')],
              defaultId : 0,
              title     : i18n.getMessage('Flash_failed'),
              message   : i18n.getMessage('Check_Serial_Port_and_enter_bootloader'),
              noLink    : true,
            }
            let WIN = getCurrentWindow()
            dialog.showMessageBoxSync(WIN, options)
            $('a.flash_opf').removeClass('disabled')
            $('a.load_file').removeClass('disabled')
            $('a.load_remote_file').removeClass('disabled')
            port.close()
          }
        }, 3000)
      } else {
        const options = {
          type      : 'warning',
          buttons   : [i18n.getMessage('Confirm')],
          defaultId : 0,
          title     : i18n.getMessage('warningTitle'),
          message   : i18n.getMessage('Connect_Serial_Port_Firstlt'),
          noLink    : true,
        }
        let WIN = getCurrentWindow()
        dialog.showMessageBoxSync(WIN, options)
      }
    })

    $('a.flash_OSD').on('click', function () {
      if ($(this).hasClass('disabled')) {
        return
      }
      if (GUI.connect_lock) {
        //串口已连接
        packNum = 0
        var buf = Buffer.alloc(1)
        buf[0] = 0x05

        port.write(buf, (err) => {
          if (err) return console.log('write Error: ', err.message)
        })

        $('a.load_file').addClass('disabled')
        $('a.load_remote_file').addClass('disabled')

        firmware_flasher.flashProgress(0)
        self.enableFlashing(false, 5)

        starting = 1
        firmware_flasher.flashFirmwareAck = false
        setTimeout(() => {
          if (firmware_flasher.flashFirmwareAck == true) {
            //固件写入正常
          } else {
            //固件烧写没有收到飞控应答
            const options = {
              type      : 'warning',
              buttons   : [i18n.getMessage('Confirm')],
              defaultId : 0,
              title     : i18n.getMessage('Flash_failed'),
              message   : i18n.getMessage('Check_Serial_Port_and_enter_bootloader'),
              noLink    : true,
            }
            let WIN = getCurrentWindow()
            dialog.showMessageBoxSync(WIN, options)
            $('a.flash_OSD').removeClass('disabled')
            $('a.load_file').removeClass('disabled')
            $('a.load_remote_file').removeClass('disabled')
            port.close()
          }
        }, 3000)
      } else {
        const options = {
          type      : 'warning',
          buttons   : [i18n.getMessage('Confirm')],
          defaultId : 0,
          title     : i18n.getMessage('warningTitle'),
          message   : i18n.getMessage('Connect_Serial_Port_Firstlt'),
          noLink    : true,
        }
        let WIN = getCurrentWindow()
        dialog.showMessageBoxSync(WIN, options)
      }
    })

    $('a.load_remote_file').on('click', function () {
      if ($(this).hasClass('disabled')) {
        return
      }
      loadRemoteFirmwareFile(self)
    })

    $('select[id="boardTarget"]').on('change', function () {
      console.log('FC boardTarget change:' + boardTarget)
      firmware_flasher.boardTarget = parseInt($(this).val(), 10)

      switch (firmware_flasher.boardTarget) {
        case 1: //cetus
          addBoarOption(firmware_flasher.firmware_version.Cetus)
          break
        case 2: //cetus_pro
          addBoarOption(firmware_flasher.firmware_version.Cetus_pro)
          break
        case 3: //lite_v3
          addBoarOption(firmware_flasher.firmware_version.Lite_v3)
          break
        default:
          break
      }
    })

    loadRemoteJsonFile()

    callback()
  })
}
