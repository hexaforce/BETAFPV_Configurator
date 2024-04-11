var VENDOR_ID = 1155
var PRODUCT_ID = [22288, 22352]

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

function addOptionValue(id, value, text, enable = true) {
  if (!isExistOption(id, value)) {
    if (enable) {
      $('#' + id).append('<option value=' + value + '>' + text + '</option>')
    } else {
      $('#' + id).append('<option value=' + value + ' disabled >' + text + '</option>')
    }
  }
}

function addBoarOption(firmware_versions) {
  $('#boardVersion').empty()
  for (let i = 0; i < firmware_versions.length; i++) {
    addOptionValue('boardVersion', i, firmware_versions[i].version)
  }
  if ($('#boardVersion').get(0).options.length === 0) {
    addOptionValue('boardVersion', -1, '(none)')
  }
}

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (ports.length !== lastPortCount) {
      $('#port option').each(function () {
        $(this).remove()
      })
    }
    // console.log('Serial Port -------------------------------')
    for (let i = 0; i < ports.length; i++) {
      console.log(ports[i])
      var enable = ports[i].productId == '5740' && (ports[i].vendorId == '0483' || ports[i].vendorId == '0493')
      addOptionValue('port', i, ports[i].path, enable)
    }
    lastPortCount = ports.length
  })
}

async function listUSBDeviceList() {
  const devices = usb.getDeviceList()
  // console.log('USB Device -------------------------------')
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
      // TODO: admin permission required
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
  if (devices.length !== lastPortCount) {
    $('#port option').each(function () {
      $(this).remove()
    })
  }
  // console.log('HID Device -------------------------------')
  for (let i = 0; i < devices.length; i++) {
    // console.log(devices[i])
    var label = `${devices[i].manufacturer} - ${devices[i].product}`
    var enable = PRODUCT_ID.includes(devices[i].productId) && devices[i].vendorId == VENDOR_ID
    addOptionValue('port', devices[i].path, label, enable)
  }
  lastPortCount = devices.length
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
