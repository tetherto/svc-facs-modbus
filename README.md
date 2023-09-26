# svc-facs-modbus

This facility implements a simple promise based modbus client. It does not use config file or take any opts.

## API

### fac.getClient

Initiates a modbus client instance for specific server.

Params:
- `opts.protocol<string>` - protocol to use, currently only `tcp` is supported
- `opts.address<string>` - host to connect to
- `opts.port<number>` - port to connect to
- `opts.unitId<number>` - unit id to use

Result:
- `ModbusClient` - modbus client instance

Example:
```js
const client = fac.getClient({
  protocol: PROTOCOL.TCP,
  address: '127.0.0.1',
  port: 502,
  unitId: 0
})
```

### ModbusClient.read

Reads data from modbus server.

Params:
- `functionCode<number>` - modbus function code
- `address<number>` - address to read from
- `length<number>` - length of data to read (default: 1)

Result:
- `Promise<Buffer>` - promise that resolves to buffer with data

Example:
```js
const data = await client.read(3, 0, 2)
```

### ModbusClient.write

Writes data to modbus server.

Params:
- `functionCode<number>` - modbus function code
- `address<number>` - address to write to
- `data<Buffer>` - data to write

Result:
- `Promise<Buffer>` - promise that resolves to buffer with data

Example:
```js
const data = await client.write(16, 0, Buffer.from([0x01, 0x02]))
```
