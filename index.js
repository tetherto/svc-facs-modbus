'use strict'

const BaseFacility = require('bfx-facs-base')
const async = require('async')
const { PROTOCOL } = require('./lib/constants')
const TcpModbusClient = require('./lib/tcp.modbus')

class ModbusFacility extends BaseFacility {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)
    this.name = 'modbus'
    this._hasConf = false
    this.clients = []
    this.init()
  }

  getClient ({ protocol, ...conf }) {
    if (protocol === PROTOCOL.TCP) {
      const client = new TcpModbusClient(conf)
      this.clients.push(client)
      return client
    } else {
      throw new Error(`ERR_UNSUPPORTED: ${protocol}`)
    }
  }

  _stop (cb) {
    async.series([
      next => { super._stop(next) },
      () => {
        for (const client of this.clients) {
          client.end()
        }
      }
    ], cb)
  }
}

module.exports = ModbusFacility
