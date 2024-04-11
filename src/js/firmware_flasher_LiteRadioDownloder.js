function readJsonFile(fileName) {
  jsonFile.readFile(fileName, function (err, jsonData) {
    if (err) throw err
    if (jsonData.status !== 404) {
      $('#boardTarget').empty()
      addOptionValue('boardTarget', 1, 'LiteRadio_2_SE')
      addOptionValue('boardTarget', 2, 'LiteRadio_2_SE_V2_SX1280')
      addOptionValue('boardTarget', 3, 'LiteRadio_2_SE_V2_CC2500')
      addOptionValue('boardTarget', 4, 'LiteRadio_3_SX1280')
      addOptionValue('boardTarget', 5, 'LiteRadio_3_CC2500')
      addBoarOption(jsonData.LiteRadio_2_SE)

      firmware_flasher_LiteRadio.firmware_version = jsonData

      console.log('----------------------------------')
    } else {
    }

    // }
  })
}

function loadRemoteJsonFile() {
  var xhr = new XMLHttpRequest()
  xhr.responseType = 'arraybuffer'
  xhr.onload = function (e) {
    var array = new Uint8Array(xhr.response)
    var file_path = path.join(__dirname, './LiteRadio.json')
    fs.writeFile(file_path, array, 'utf8', (err) => {
      if (err) {
        alert(i18n.getMessage('write_file_failed'))
      } else {
        readJsonFile(file_path)
      }
    })
  }
  //1.优先访问github上的固件
  setTimeout(() => {
    xhr.open('GET', 'https://github.com/BETAFPV/BETAFPV.github.io/releases/download/v2.0.0/LiteRadio.json', true)
    xhr.send(null)
    console.log('get literadio.json from github')
  }, 1000)
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 2) {
    } else if (xhr.readyState == 3) {
    }
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        //ok
        //从github上加载固件成功
        // alert("Request firmware successful: "+xhr.status);
        console.log('get json file successful')
        loadJsonFileFromGithubSuccessful = true
      }
      // else if(xhr.status == 400){
      //     alert("Bad Request : "+xhr.status);
      // }else if(xhr.status == 401){
      //     alert("Request was Unauthonzed: "+xhr.status);
      // }else if(xhr.status == 403){
      //     alert("Request was Forbidden: "+xhr.status);
      // }else if(xhr.status == 404){
      //     alert("Request was Not Found: "+xhr.status);
      // }else if(xhr.status == 500){
      //     alert(" Internal Server Error: "+xhr.status);
      // }else if(xhr.status == 503){
      //     alert("Service Unavailable : "+xhr.status);
      // }
      else {
        //2.github无法访问切换到gittee上访问
        if (loadJsonFileFromGithubSuccessful == true) {
          loadJsonFileFromGithubSuccessful = false
          console.log("can't load json file from github")
        } else {
          console.log("can't load json file from gitee")
        }
      }
    }
  }
  //3.超时无法连接github则从gitee上加载
  setTimeout(() => {
    if (loadJsonFileFromGithubSuccessful == false) {
      xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955204/download/LiteRadio.json', true)
      xhr.send(null)
      console.log('get json file from gitee')
    }
  }, 5000)
  xhr.timeout = 3000
  xhr.ontimeout = function () {
    loadJsonFileFromGithubSuccessful = false
    console.log('get json file time out')
  }
}

function loadRemoteFirmwareFile(self) {
  let targetBoardSelected = $('#boardTarget option:selected').text()
  let targetVersionSelected = $('#boardVersion option:selected').text()
  var str = targetBoardSelected + '_' + targetVersionSelected + '.bin'

  // var urlValue = "https://github.com/BETAFPV/BETAFPV.github.io/releases/download/v1/" + str;
  var urlValue = 'https://github.com/BETAFPV/BETAFPV.github.io/releases/download/v2.0.0/' + str

  var xhr = new XMLHttpRequest()
  xhr.open('GET', urlValue, true)
  xhr.responseType = 'arraybuffer'
  xhr.onload = function (e) {
    var array = new Uint8Array(xhr.response)

    fs.writeFile(path.join(__dirname, str), array, 'utf8', (err) => {
      if (err) {
        alert(i18n.getMessage('write_file_failed'))
      } else {
        binFilePath = path.join(__dirname, str)
        fs.readFile(binFilePath, (err, binFile) => {
          if (err) {
          } else {
            binSize = binFile.length
            packLen = Math.round(binSize / 1024)
            if (packLen > 10) {
              self.enableFlashing(true)
              firmware_flasher_LiteRadio.flashingMessage('Load Firmware Sucessfuly! Firmware Size: ( ' + binFile.length + 'bytes )', self.FLASH_MESSAGE_TYPES.NEUTRAL)
            } else {
              self.enableFlashing(false)
              firmware_flasher_LiteRadio.flashingMessage('Load Firmware Failure!')
            }
          }
        })
      }
    })
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 2) {
    } else if (xhr.readyState == 3) {
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
        }
      }
    }
  }
  xhr.send()
  setTimeout(() => {
    if (loadFirmwareFromGithubSuccessful == false) {
      let firmware_name = targetBoardSelected + '_' + targetVersionSelected + '.bin'
      switch (firmware_name) {
        case 'LiteRadio_2_SE_1.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/881713/download/LiteRadio_2_SE_1.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_SX1280_1.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/881708/download/LiteRadio_2_SE_V2_SX1280_1.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_SX1280_1.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/882149/download/LiteRadio_2_SE_V2_SX1280_1.0.1.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_SX1280_1.0.2.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/933691/download/LiteRadio_2_SE_V2_SX1280_1.0.2.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_SX1280_2.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955209/download/LiteRadio_2_SE_V2_SX1280_2.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_SX1280_2.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955205/download/LiteRadio_2_SE_V2_SX1280_2.0.1.bin', true)
          xhr.send(null)
          break

        case 'LiteRadio_3_SX1280_1.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/881711/download/LiteRadio_3_SX1280_1.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_SX1280_1.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/882150/download/LiteRadio_3_SX1280_1.0.1.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_SX1280_1.0.2.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/933685/download/LiteRadio_3_SX1280_1.0.2.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_SX1280_2.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955211/download/LiteRadio_3_SX1280_2.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_SX1280_2.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955206/download/LiteRadio_3_SX1280_2.0.1.bin', true)
          xhr.send(null)
          break

        case 'LiteRadio_2_SE_V2_CC2500_1.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/881707/download/LiteRadio_2_SE_V2_CC2500_1.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_CC2500_1.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/933688/download/LiteRadio_2_SE_V2_CC2500_1.0.1.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_CC2500_1.0.2.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/933689/download/LiteRadio_2_SE_V2_CC2500_1.0.2.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_CC2500_2.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955210/download/LiteRadio_2_SE_V2_CC2500_2.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_2_SE_V2_CC2500_2.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955208/download/LiteRadio_2_SE_V2_CC2500_2.0.1.bin', true)
          xhr.send(null)
          break

        case 'LiteRadio_3_CC2500_1.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/881712/download/LiteRadio_3_CC2500_1.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_CC2500_1.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/933682/download/LiteRadio_3_CC2500_1.0.1.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_CC2500_1.0.2.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/933681/download/LiteRadio_3_CC2500_1.0.2.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_CC2500_2.0.0.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955212/download/LiteRadio_3_CC2500_2.0.0.bin', true)
          xhr.send(null)
          break
        case 'LiteRadio_3_CC2500_2.0.1.bin':
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/955207/download/LiteRadio_3_CC2500_2.0.1.bin', true)
          xhr.send(null)
          break

        default:
          xhr.open('GET', 'https://gitee.com/huang_wen_tao123/lite-radio_-elrs_-release/attach_files/856701/download/null.bin', true)
          xhr.send(null)
          break
      }
    }
  }, 2000)

  xhr.timeout = 1800
  xhr.ontimeout = function () {
    console.log('get firmware time out')
    loadFirmwareFromGithubSuccessful = false
  }
}

module.exports = { loadRemoteJsonFile, loadRemoteFirmwareFile }
