'use strict'

const { FUNCTION_CODES } = require('./constants')
const { promiseFlat } = require('@bitfinex/lib-js-util-promise')

class ModbusClient {
  constructor ({ address, port, unitId, timeout }) {
    this.address = address
    this.port = port
    this.unitId = unitId
    this.timeout = timeout
    this.lastTid = 1
    this.packets = []
  }

  getTid () {
    if (this.lastTid === 65534) {
      this.lastTid = 1
    }
    return this.lastTid++
  }

  _craftRawPacket (transId, protoId, funcCode, address, data, length) {
    if (typeof data === 'boolean') {
      data = data ? 1 : 0
    }

    if (address === 0) {
      address = 65535
    } else {
      address = address - 1
    }

    let dataBytes = 0
    if (funcCode === FUNCTION_CODES.WRITE_MULTIPLE_COILS) {
      dataBytes = length
    } else if (funcCode === FUNCTION_CODES.WRITE_MULTIPLE_REGISTERS) {
      dataBytes = length * 2
    }

    let bufferLength = 12
    if (funcCode === FUNCTION_CODES.WRITE_MULTIPLE_COILS || funcCode === FUNCTION_CODES.WRITE_MULTIPLE_REGISTERS) {
      bufferLength += dataBytes + 1
    }

    const buf = Buffer.alloc(bufferLength)

    buf.writeUInt16BE(transId, 0)
    buf.writeUInt16BE(protoId, 2)
    buf.writeUInt16BE(bufferLength - 6, 4)
    buf.writeUInt8(this.unitId, 6)
    buf.writeUInt8(funcCode, 7)
    buf.writeUInt16BE(address, 8)

    if (funcCode === FUNCTION_CODES.WRITE_MULTIPLE_COILS || funcCode === FUNCTION_CODES.WRITE_MULTIPLE_REGISTERS) {
      buf.writeUInt16BE(length, 10)
      buf.writeUInt8(dataBytes, 12)
      data.copy(buf, 13)
    } else if (funcCode === FUNCTION_CODES.WRITE_SINGLE_COIL || funcCode === FUNCTION_CODES.WRITE_SINGLE_REGISTER) {
      buf.writeUInt16BE(data, 10)
    } else {
      buf.writeUInt16BE(length, 10)
    }

    return buf
  }

  async read (functionCode, address, length = 1) {
    const { promise, resolve, reject } = promiseFlat()
    const tid = this.getTid()
    const buf = this._craftPacket(tid, 0, functionCode, address, null, length)
    this.packets[tid] = {
      resolve,
      reject,
      tx: {
        functionCode,
        tid,
        address,
        hex: buf.toString('hex')
      },
      rx: null
    }
    await this._sendPacket(buf)
    return promise
  }

  async write (functionCode, address, data, length = 1) {
    const { promise, resolve, reject } = promiseFlat()
    const tid = this.getTid()
    const buf = this._craftPacket(tid, 0, functionCode, address, data, length)
    this.packets[tid] = {
      resolve,
      reject,
      tx: {
        functionCode,
        tid,
        address,
        hex: buf.toString('hex')
      },
      rx: null
    }
    await this._sendPacket(buf)
    return promise
  }
}


module.exports = ModbusClient
