function isExistOption(id, value) {
  var isExist = false
  var count = $('#' + id).find('option').length

  for (var i = 0; i < count; i++) {
    if ($('#' + id).get(0).options[i].value == value) {
      isExist = true
      break
    }
  }
  return isExist
}

function addOptionValue(id, value, text) {
  if (!isExistOption(id, value)) {
    $('#' + id).append('<option value=' + value + '>' + text + '</option>')
  }
}

function addBoarOption(firmware_versions) {
  $('#boardVersion').empty()
  for (let i = 0; i < firmware_versions.length; i++) {
    addOptionValue('boardVersion', i, firmware_versions[i].version)
  }
}

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (ports.length !== lastPortCount) {
      $('#port option').each(function () {
        $(this).remove()
      })
    }

    for (let i = 0; i < ports.length; i++) {
      if (ports[i].productId == '5740' && (ports[i].vendorId == '0483' || ports[i].vendorId == '0493')) {
        addOptionValue('port', i, ports[i].path)
      }
    }
    lastPortCount = ports.length
  })
}

async function listUSBDeviceList() {
  const devices = usb.getDeviceList()
  console.log('USB Device -------------------------------')
  for (const device of devices) {
    // console.log(device.deviceDescriptor)
    const { idVendor, idProduct, bcdDevice, iManufacturer, iProduct } = device.deviceDescriptor
    async function getStringDescriptor(desc_index) {
      return new Promise((resolve, reject) => {
        device.getStringDescriptor(desc_index, (error, data) => {
          error ? reject(error) : resolve(data)
        })
      })
    }

    try {
      device.open()
      var manufacturer = await getStringDescriptor(iManufacturer)
      var product = await getStringDescriptor(iProduct)
      console.log(`${manufacturer} - ${product}`)
    } catch (error) {
      console.log('Error:', error)
    } finally {
      device.close()
    }
  }
}

async function listHIDDeviceList() {
  var devices = HID.devices()
  console.log('HID Device -------------------------------')
  devices.forEach((device) => {
    const { vendorId, manufacturer, product, productId, serialNumber, pathusage, usagePage } = device
    console.log(`${manufacturer} - ${product}`)
  })
}

function loadLanguage() {
  i18next.changeLanguage(i18n.Storage_language)
  const x = document.getElementById('wechat_facebook_logo_src_switch')
  if (!x) return
  switch (i18n.Storage_language) {
    case 'zh':
      x.src = './src/images/wechat_icon.png'
      break
    default:
      x.src = './src/images/flogo_RGB_HEX-1024.svg'
  }
}

function find_serial_port_doc() {
  let Unable_to_find_serial_port = document.getElementById('Unable_to_find_serial_port')
  Unable_to_find_serial_port.onclick = function (e) {
    e.preventDefault()
    if (i18n.selectedLanguage == 'zh') {
      shell.openExternal('https://github.com/BETAFPV/BETAFPV_Configurator/blob/master/docs/UnableToFindSerialPort_CN.md')
    } else {
      shell.openExternal('https://github.com/BETAFPV/BETAFPV_Configurator/blob/master/docs/UnableToFindSerialPort_EN.md')
    }
  }
}

module.exports = { addOptionValue, addBoarOption, listSerialPorts, listUSBDeviceList, listHIDDeviceList, loadLanguage, find_serial_port_doc }
