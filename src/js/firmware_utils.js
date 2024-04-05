function CRC16_Check(puData) {
  var len = puData.length

  if (len > 0) {
    var crc = 0x0000

    for (var i = 0; i < 1024; i++) {
      crc = crc ^ ((puData[3 + i] << 8) & 0xff00)

      for (var j = 0; j < 8; j++) {
        if (crc & 0x8000) crc = (crc << 1) ^ 0x1021
        //CRC-ITU
        else crc = crc << 1
      }
      crc &= 0xffff
    }

    var hi = (crc >> 8) & 0xff //高位置
    var lo = crc & 0xff //低位置

    puData[1027] = hi
    puData[1028] = lo
  }
}

function CRC16_Name(puData) {
  var len = puData.length

  if (len > 0) {
    var crc = 0x0000

    for (var i = 0; i < 128; i++) {
      crc = crc ^ ((puData[3 + i] << 8) & 0xff00)

      for (var j = 0; j < 8; j++) {
        if (crc & 0x8000) crc = (crc << 1) ^ 0x1021
        //CRC-ITU
        else crc = crc << 1
      }
      crc &= 0xffff
    }

    var hi = (crc >> 8) & 0xff //高位置
    var lo = crc & 0xff //低位置

    puData[131] = hi
    puData[132] = lo
  }
}

module.exports = { CRC16_Check, CRC16_Name }
