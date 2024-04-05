function readJsonFile(fileName) {
  jsonFile.readFile(fileName, function (err, jsonData) {
    if (err) throw err
    if (jsonData.status !== 404) {
      $('#boardTarget').empty()
      addOptionValue('boardTarget', 1, 'Cetus')
      addOptionValue('boardTarget', 2, 'Cetus Pro')
      addOptionValue('boardTarget', 3, 'Lite V3')
      addOptionValue('boardTarget', 4, 'Cetus X')
      addOptionValue('boardTarget', 5, 'Cetus X HD')
      addOptionValue('boardTarget', 6, 'Aquila16')

      $('#boardVersion').empty()
      for (let i = 0; i < jsonData.Cetus.length; i++) {
        addOptionValue('boardVersion', i, jsonData.Cetus[i].version)
      }
      firmware_flasher.firmware_version = jsonData

      console.log('----------------------------------')
    } else {
    }
  })
}

function loadRemoteJsonFile() {
  var xhr = new XMLHttpRequest()
  loadJsonFileFromGithubSuccessful = true

  xhr.responseType = 'arraybuffer'
  xhr.onload = function (e) {
    var array = new Uint8Array(xhr.response)
    var file_path = path.join(__dirname, './board.json')
    fs.writeFile(file_path, array, 'utf8', (err) => {
      if (err) {
        console.log('error')
      } else {
        console.log('ok')
        readJsonFile(file_path)
      }
    })
  }

  //1.优先访问github上的固件
  setTimeout(() => {
    xhr.open('GET', 'https://github.com/BETAFPV/BETAFPV.github.io/releases/download/v3.0.0/board.json', true)
    xhr.send(null)
    console.log('get literadio.json from github')
  }, 1000)

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        //从github上加载固件成功
        loadJsonFileFromGithubSuccessful = true
      } else {
        //2.github无法访问切换到gittee上访问
        if (loadJsonFileFromGithubSuccessful == true) {
          loadJsonFileFromGithubSuccessful = false
          console.log("can't load json file from github")
        } else {
          console.log("can't load json file from gitee")
          const options = {
            type      : 'warning',
            buttons   : [i18n.getMessage('Confirm')],
            defaultId : 0,
            title     : i18n.getMessage('FailedToLoadFile'),
            message   : i18n.getMessage('InvalidNetwork'),
            noLink    : true,
          }
          let WIN = getCurrentWindow()
          dialog.showMessageBoxSync(WIN, options)
        }
      }
    }
  }

  //3.超市无法连接github则从gitee上加载
  setTimeout(() => {
    if (loadJsonFileFromGithubSuccessful == false) {
      xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/907650/download/board.json', true)
      xhr.send(null)
      console.log('get json file from gitee')
      ;``
    }
  }, 4000)

  xhr.timeout = 2500
  xhr.ontimeout = function () {
    loadJsonFileFromGithubSuccessful = false
    console.log('get json file time out')
  }
}

function loadRemoteFirmwareFile(self) {
  let targetBoardSelected = $('#boardTarget option:selected').text()
  let targetVersionSelected = $('#boardVersion option:selected').text()
  loadFirmwareFromGithubSuccessful = true
  var str = targetBoardSelected + '_' + targetVersionSelected + '.bin'
  var urlValue = 'https://github.com/BETAFPV/BETAFPV.github.io/releases/download/v3.0.0/' + str

  var xhr = new XMLHttpRequest()
  xhr.open('GET', urlValue, true)
  xhr.responseType = 'arraybuffer'
  xhr.onload = function (e) {
    var array = new Uint8Array(xhr.response)

    fs.writeFile(path.join(__dirname, str), array, 'utf8', (err) => {
      if (err) {
        console.log('error')
      } else {
        binFilePath = path.join(__dirname, str)
        fs.readFile(binFilePath, (err, binFile) => {
          if (err) {
            alert(err)
          } else {
            self.enableFlashing(true, 1)
            binSize = binFile.length - 12
            var binSizeTemp = binFile.length

            packLen = Math.round(binSize / 1024)
            if (packLen > 5) {
              self.enableFlashing(true, 1)
              firmware_flasher.flashingMessage(i18n.getMessage('firmwareFlasherRemoteFirmwareLoaded') + binFile.length + 'bytes ', self.FLASH_MESSAGE_TYPES.NEUTRAL)
              if (binFile[binSizeTemp - 12] == 0x5a) {
                let targetID = binFile[binSizeTemp - 11]
                if (targetID == flashTarget.flightControl) {
                  $('#TargetID').text(i18n.getMessage('flightControl'))
                  currentflashTarget = flashTarget.flightControl
                } else if (targetID == flashTarget.opticalFlow) {
                  $('#TargetID').text(i18n.getMessage('Sensors'))
                  currentflashTarget = flashTarget.opticalFlow
                } else if (targetID == flashTarget.OSD) {
                  $('#TargetID').text(i18n.getMessage('OSD'))
                  currentflashTarget = flashTarget.OSD
                }
                let boardID = binFile[binSizeTemp - 10]
                if (boardID == flashBoard.Cetus) {
                  $('#BoardID').text('   Cetus')
                } else if (boardID == flashBoard.Cetus_pro) {
                  if (str.includes('Cetus_pro_1.1.')) {
                    $('#BoardID').text(i18n.getMessage('cetus_pro_hardware_lt_1_2'))
                  } else if (str.includes('Cetus_pro_1.2.')) {
                    $('#BoardID').text(i18n.getMessage('cetus_pro_hardware_gte_1_2'))
                  } else {
                    $('#BoardID').text('   Cetus Pro')
                  }
                } else if (boardID == flashBoard.Lite_v3) {
                  $('#BoardID').text('   Lite Brushed v3')
                }

                var versionID = '  v' + binFile[binSizeTemp - 9] + '.' + binFile[binSizeTemp - 8] + '.' + binFile[binSizeTemp - 7]
                $('#VersionID').text(versionID)

                var dateID = '  ' + binFile[binSizeTemp - 6] + binFile[binSizeTemp - 5] + binFile[binSizeTemp - 4] + binFile[binSizeTemp - 3] + '-' + binFile[binSizeTemp - 2] + '-' + binFile[binSizeTemp - 1]
                $('#DateID').text(dateID)

                $('#FileID').text(str)
              }
            } else {
              self.enableFlashing(false, 1)
              firmware_flasher.flashingMessage(i18n.getMessage('firmwareFlasherFailedToLoadOnlineFirmware'))
              $('#FileID').text('Unrecognized firmware!')
              $('#TargetID').text('    ')
              $('#BoardID').text('   ')
              $('#VersionID').text(' ')
              $('#DateID').text(' ')
            }
          }
        })
      }
    })
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 2) {
      console.log('The server is connected:' + xhr.status)
    } else if (xhr.readyState == 3) {
      console.log('Request was received :' + xhr.status)
    }

    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        //ok
        loadFirmwareFromGithubSuccessful = true
      } else {
        if (loadFirmwareFromGithubSuccessful == true) {
          loadFirmwareFromGithubSuccessful = false
          console.log("can't load firmware from github")
        } else {
          console.log("can't load firmware from gitee")
          const options = {
            type      : 'warning',
            buttons   : [i18n.getMessage('Confirm')],
            defaultId : 0,
            title     : i18n.getMessage('FailedToLoadFile'),
            message   : i18n.getMessage('InvalidNetwork'),
            noLink    : true,
          }
          let WIN = getCurrentWindow()
          dialog.showMessageBoxSync(WIN, options)
        }
      }
    }
  }

  xhr.send()
  xhr.timeout = 2000
  xhr.ontimeout = function () {
    console.log('get firmware time out')
    loadFirmwareFromGithubSuccessful = false
  }
  setTimeout(() => {
    if (loadFirmwareFromGithubSuccessful == false) {
      let firmware_name = targetBoardSelected + '_' + targetVersionSelected + '.bin'
      switch (firmware_name) {
        case 'Cetus_1.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/865138/download/Cetus_1.0.0.bin', true)
          xhr.send(null)
          break
        case 'Cetus_1.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/908085/download/Cetus_1.0.1.bin', true)
          xhr.send(null)
          break
        case 'Cetus_pro_1.1.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/876366/download/Cetus_pro_1.1.1.bin', true)
          xhr.send(null)
          break
        case 'Cetus_pro_1.1.2.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/907652/download/Cetus_pro_1.1.2.bin', true)
          xhr.send(null)
          break
        case 'Cetus_pro_1.2.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/876367/download/Cetus_pro_1.2.1.bin', true)
          xhr.send(null)
          break
        case 'Cetus_pro_1.2.2.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/907654/download/Cetus_pro_1.2.2.bin', true)
          xhr.send(null)
          break
        case 'Lite_v3_1.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/867760/download/Lite_v3_1.0.0.bin', true)
          xhr.send(null)
          break
        case 'Lite_v3_1.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/flight_control_firmware/attach_files/907651/download/Lite_v3_1.0.1.bin', true)
          xhr.send(null)
          break
        default:
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/856701/download/null.bin', true)
          xhr.send(null)
          break
      }
    }
  }, 2500)
}

module.exports = { loadRemoteJsonFile, loadRemoteFirmwareFile }
