'use strict'

const ModbusClient = require('./modbus')
const net = require('net')

class TcpModbusClient extends ModbusClient {
  constructor ({ address, port, unitId, timeout = 5000 }) {
    super({ address, port, unitId, timeout })
    this.client = new net.Socket()
    this.online = false

    this.client.on('data', this._handleData.bind(this))
    this.client.on('close', this._setOffline.bind(this))
    this.client.on('error', this._setOffline.bind(this))
    this.client.on('connect', this._setOnline.bind(this))

    this._craftPacket = super._craftRawPacket
  }

  async _handleData (data) {
    const res = {}

    res.tid = data.readUInt16BE(0)
    res.protoId = data.readUInt16BE(2)
    res.len = data.readUInt16BE(4)
    res.unitId = data.readInt8(6)
    res.funcCode = data.readInt8(7)
    res.byteCount = Math.abs(data.readInt8(8))
    if (data.length > 9) {
      res.value = data.subarray(9)
    }

    const packet = this.packets[res.tid]
    packet.resolve(res.value)
    delete this.packets[res.tid]
  }

  _setOnline (opts) {
    this.online = true
  }

  _setOffline (opts) {
    this.online = false
  }

  async _sendPacket (packet) {
    if (!this.online) {
      await this.connect()
    }
    this.client.write(packet)
  }

  connect () {
    return new Promise((resolve, reject) => {
      let timer = null
      const _connFunc = () => {
        this.online = true
        clearTimeout(timer)
        resolve()
      }
      this.client.connect(this.port, this.address, _connFunc)
      timer = setTimeout(() => {
        if (!this.online) {
          this.client.removeListener('connect', _connFunc)
          reject(new Error('ERR_CONNECT_TIMEOUT'))
        }
      }, this.timeout)
    })
  }

  end () {
    this.client.destroy()
  }
}

module.exports = TcpModbusClient
