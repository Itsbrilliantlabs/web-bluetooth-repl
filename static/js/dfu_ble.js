
const crc32=function(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};

//file utils
async function unZip(zipFilePath) {
  console.log(zipFilePath)
  zip.configure({ chunkSize: 128, useWebWorkers: true });
	const zipReader = new zip.ZipReader(new zip.HttpReader(zipFilePath, { preventHeadRequest: true }));
	const entries = await zipReader.getEntries();
  console.log(entries)
  // const reader = new zip.ZipReader(new zip.BlobReader(zipFilePath));
  // console.log((new zip.ZipReader(new zip.BlobReader(zipFilePath))).getEntries("application/zip"))
  // const zipfileReader = new zip.BlobReader(zipFilePath);
  // const entryNames = await reader.getEntries();
  // // console.log(reader.then(d=>console))
  // entryNames = []
  // entryNames.forEach(d=>{
  //   console.log(d)
  // })
  // const zipEntries = zipfile.getEntries();

// console.log(zipfileReader)
  // zipfile.extractAllTo(`${__dirname}/tmp`, true);

  const entryNames = [];
  // zipEntries.forEach((zipEntry) => {
  //   entryNames.push(zipEntry.entryName);
  // });

  return entryNames;
}

function parseBinaryFile(_dfu_rul) {

  return new Promise((resolve, reject) => {
    fetch(_dfu_rul, {
      mode: "no-cors"                   
    }).then(res=>{
      console.log(res)
    }).catch(function(err) {
      console.log('Fetch Error :-S', err);
      reject(err);
    });
  });
}

// little_endian_utils

function littleEndianUInt32(x) {
    const tmp = ((x >> 24) & 0xff) | ((x << 8) & 0xff0000) | ((x >> 8) & 0xff00) | ((x << 24) & 0xff000000)
    return tmp >>> 0; // Preserve unsigned.
  }
  
  // Note, this is currently converting converting to little endian and returning a Uint8 Array.
  // TODO: BUG? Is nrf52832_xxaa.dat already LE?
  function littleEndian(src) {
    const buffer = new ArrayBuffer(src.length);
  
    for (let i = 0, j = src.length - 1; i <= j; ++i, --j) {
      buffer[i] = src[j];
      buffer[j] = src[i];
    }
  
    return new Uint8Array(src);
  }

// https://infocenter.nordicsemi.com/topic/com.nordic.infocenter.sdk5.v12.0.0/lib_dfu_transport_ble.html?cp=4_0_0_3_4_3_2
const BASE_SERVICE_UUID = '0000xxxx-0000-1000-8000-00805f9b34fb';
const SECURE_DFU_SERVICE_UUID = BASE_SERVICE_UUID.replace('xxxx', 'fe59');

const BASE_CHARACTERISTIC_UUID = '8ec9xxxx-f315-4f60-9fb8-838830daea50';
const DFU_CONTROL_POINT_UUID = BASE_CHARACTERISTIC_UUID.replace('xxxx', '0001');
const DFU_PACKET_UUID = BASE_CHARACTERISTIC_UUID.replace('xxxx', '0002');

const BLE_PACKET_SIZE = 20;


// TODO: This function should be made more generic without hard coded services/characteristics.
function deviceDiscover() {
  let globalDevice;
  let globalServer;
  let dfuService;
  let controlPointChar;

  return new Promise((resolve, reject) => {
    navigator.bluetooth.requestDevice({ filters: [{ services: [SECURE_DFU_SERVICE_UUID] }] })
    .then((device) => {
      globalDevice = device;
      return device.gatt.connect();
    })
    .then((server) => {
      globalServer = server;
      return server.getPrimaryService(SECURE_DFU_SERVICE_UUID);
    })
    .then((service) => {
      dfuService = service;
      return service.getCharacteristic(DFU_CONTROL_POINT_UUID);
    })
    .then((characteristic) => {
      controlPointChar = characteristic;
      return dfuService.getCharacteristic(DFU_PACKET_UUID);
    })
    .then((characteristic) => {
      resolve({
        device: globalDevice,
        server: globalServer,
        service: dfuService,
        controlPointCharacteristic: controlPointChar,
        packetCharacteristic: characteristic,
      });
    })
    .catch((error) => {
      reject(error);
    });
  });
}


function enableNotifications(controlPointCharacteristic, eventListener) {
  return new Promise((resolve, reject) => {
    controlPointCharacteristic.startNotifications()
    .then(() => {
      controlPointCharacteristic.addEventListener('characteristicvaluechanged', eventListener);
      resolve();
    })
    .catch((error) => {
      reject(error);
    });
  });
}


function sendData(characteristic, buffer) {
  return new Promise((resolve, reject) => {
    if (buffer.length <= 0) {
      resolve();
    } else {
      // HACK: Needed side effect here, littleEndian is converting buffer to UInt8 Array...
      characteristic.writeValue(littleEndian(buffer.slice(0, BLE_PACKET_SIZE)))
      .then(() => sendData(characteristic, buffer.slice(BLE_PACKET_SIZE)))
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
    }
  });
}


// exports.deviceDiscover = deviceDiscover;
// exports.enableNotifications = enableNotifications;
// exports.sendData = sendData;

// Control point procedure opcodes.
const CONTROL_OPCODES = {
    CREATE: 0x01,
    SET_PRN: 0x02,
    CALCULATE_CHECKSUM: 0x03,
    EXECUTE: 0x04,
    SELECT: 0x06,
    RESPONSE_CODE: 0x60,
  };
  
  const CONTROL_PARAMETERS = {
    COMMAND_OBJECT: 0x01,
    DATA_OBJECT: 0x02,
    // size: Object size in little endian, set by caller.
    // vale: Number of packets to be sent before receiving a PRN, set by caller. Default == 0.
  };
  
  // Index of response value fields in response packet.
  const BASE_POS = 3;
  
  const CALCULATE_CHECKSUM_RESPONSE_FIELD = {
    OFFSET: BASE_POS + 0,
    CRC32: BASE_POS + 4,
  };
  
  const SELECT_RESPONSE_FIELD = {
    MAXIMUM_SIZE: BASE_POS + 0,
    OFFSET: BASE_POS + 4,
    CRC32: BASE_POS + 8,
  };
  
  // Possible result codes sent in the response packet.
  const RESULT_CODES = {
    INVALID_CODE: 0x00,
    SUCCESS: 0x01,
    OPCODE_NOT_SUPPORTED: 0x02,
    INVALID_PARAMETER: 0x03,
    INSUFFICIENT_RESOURCES: 0x04,
    INVALID_OBJECT: 0x05,
    UNSUPPORTED_TYPE: 0x07,
    OPERATION_NOT_PERMITTED: 0x08,
    OPERATION_FAILED: 0x0A,
  };
  
  const reverseLookup = obj => val => {
    for (const k of Object.keys(obj)) {
      if (obj[k] === val) {
        return k;
      }
    }
    return 'UNKNOWN';
  };
  
  const controlOpCodeToString = reverseLookup(CONTROL_OPCODES);
  const resultCodeToString = reverseLookup(RESULT_CODES);
  
  
  function parseResponse(response) {
    const responseCode = response.getUint8(0);
    const responseOpCode = response.getUint8(1);
    const resultCode = response.getUint8(2);
    let responseSpecificData;
  
    console.log(response);
  
    if (responseCode !== CONTROL_OPCODES.RESPONSE_CODE) {
      throw new Error(`Unexpected response code received: ${controlOpCodeToString(responseCode)}.`);
    }
    if (resultCode !== RESULT_CODES.SUCCESS) {
      throw new Error(`Error in result code: ${resultCodeToString(resultCode)}.`);
    }
  
    switch (responseOpCode) {
      case CONTROL_OPCODES.CREATE:
        break;
      case CONTROL_OPCODES.SET_PRN:
        break;
      case CONTROL_OPCODES.CALCULATE_CHECKSUM:
        responseSpecificData = {
          offset: littleEndianUInt32(response.getUint32(CALCULATE_CHECKSUM_RESPONSE_FIELD.OFFSET)),
          crc32: littleEndianUInt32(response.getUint32(CALCULATE_CHECKSUM_RESPONSE_FIELD.CRC32)),
        };
        break;
      case CONTROL_OPCODES.EXECUTE:
        break;
      case CONTROL_OPCODES.SELECT:
        responseSpecificData = {
          maximumSize: littleEndianUInt32(response.getUint32(SELECT_RESPONSE_FIELD.MAXIMUM_SIZE)),
          offset: littleEndianUInt32(response.getUint32(SELECT_RESPONSE_FIELD.OFFSET)),
          crc32: littleEndianUInt32(response.getUint32(SELECT_RESPONSE_FIELD.CRC32)),
        };
        break;
      default:
        throw new Error(`Unknwon response op-code received: ${controlOpCodeToString(responseOpCode)}.`);
    }
  
    return {
      responseCode: responseCode,
      responseOpCode: responseOpCode,
      resultCode: resultCode,
      data: responseSpecificData,
    };
  }
  
  
  let gatt;
  let expectedCRC;
  
  
  function controlPointNotificationHandler(event) {
    const response = event.target.value;
    const parsedResponse = parseResponse(response);
    const responseOpCode = parsedResponse.responseOpCode;
  
    console.log(parsedResponse);
  
    switch (responseOpCode) {
      case CONTROL_OPCODES.CREATE:
        console.log('CREATE');
        gatt.controlPointCharacteristic.writeValue(
          new Uint8Array([CONTROL_OPCODES.SET_PRN, 0x00, 0x00])) // TODO:
        .catch((error) => {
          throw error;
        });
        break;
      case CONTROL_OPCODES.SET_PRN:
        console.log('SET_PRN');
        fileUtils.parseBinaryFile(`${__dirname}/tmp/nrf52832_xxaa.dat`)
        .then((result) => {
          expectedCRC = crc32(result);
          console.log(expectedCRC);
          return sendData(gatt.packetCharacteristic, result);
        })
        .then(() => gatt.controlPointCharacteristic.writeValue(
            new Uint8Array([CONTROL_OPCODES.CALCULATE_CHECKSUM])))
        .catch((error) => {
          throw error;
        });
        break;
      case CONTROL_OPCODES.CALCULATE_CHECKSUM:
        console.log('CALCULATE_CHECKSUM');
        // TODO: Check if offset and crc is correct before executing.
        gatt.controlPointCharacteristic.writeValue(new Uint8Array([CONTROL_OPCODES.EXECUTE]))
        .catch((error) => {
          throw error;
        });
        break;
      case CONTROL_OPCODES.EXECUTE:
        console.log('EXECUTE');
        gatt.controlPointCharacteristic.removeEventListener('characteristicvaluechanged',
          controlPointNotificationHandler);
        gatt.controlPointCharacteristic.addEventListener('characteristicvaluechanged',
          dataEventListener);
        gatt.controlPointCharacteristic.writeValue(
          new Uint8Array([CONTROL_OPCODES.SELECT, CONTROL_PARAMETERS.DATA_OBJECT]))
        .catch((error) => {
          throw error;
        });
        break;
      case CONTROL_OPCODES.SELECT:
        console.log('SELECT');
        // TODO: Some logic to determine if a new object should be created or not.
        gatt.controlPointCharacteristic.writeValue(
          new Uint8Array([CONTROL_OPCODES.CREATE,
                          CONTROL_PARAMETERS.COMMAND_OBJECT,
                          0x8a, 0x0, 0x0, 0x0])) // TODO: Size should not be hard-coded.
        .catch((error) => {
          throw error;
        });
        break;
      default:
        throw new Error(`Unknwon response op-code received: ${controlOpCodeToString(responseOpCode)}.`);
    }
  }
  
  
  let imageBuf;
  
  function dataEventListener(event) {
    const response = event.target.value;
    const parsedResponse = parseResponse(response);
    const responseOpCode = parsedResponse.responseOpCode;
  
    console.log(parsedResponse);
  
    switch (responseOpCode) {
      case CONTROL_OPCODES.CREATE:
        console.log('CREATE');
        sendData(gatt.packetCharacteristic, imageBuf.slice(0, 0x1000))
        .then(() => gatt.controlPointCharacteristic.writeValue(
            new Uint8Array([CONTROL_OPCODES.CALCULATE_CHECKSUM])))
        .catch((error) => {
          throw error;
        });
        break;
      case CONTROL_OPCODES.SET_PRN:
        console.log('SET_PRN');
        break;
      case CONTROL_OPCODES.CALCULATE_CHECKSUM:
        console.log('CALCULATE_CHECKSUM');
        expectedCRC = crc32(imageBuf.slice(0, 0x1000));
        console.log(expectedCRC);
        imageBuf = imageBuf.slice(0x1000);
        if (imageBuf.length !== 0) {
          sendData(gatt.packetCharacteristic, imageBuf.slice(0, 0x1000))
          .then(() => gatt.controlPointCharacteristic.writeValue(
            new Uint8Array([CONTROL_OPCODES.CALCULATE_CHECKSUM])))
          .catch((error) => {
            throw error;
          });
        } else {
          gatt.controlPointCharacteristic.writeValue(new Uint8Array([CONTROL_OPCODES.EXECUTE]))
          .catch((error) => {
            throw error;
          });
        }
        break;
      case CONTROL_OPCODES.EXECUTE:
        console.log('EXECUTE');
        break;
      case CONTROL_OPCODES.SELECT:
        console.log('SELECT');
        parseBinaryFile(`${__dirname}/tmp/nrf52832_xxaa.bin`)
        .then((result) => {
          imageBuf = result;
          console.log(imageBuf.length);
          return gatt.controlPointCharacteristic.writeValue(
            new Uint8Array([CONTROL_OPCODES.CREATE,
              CONTROL_PARAMETERS.DATA_OBJECT,
              0x0, 0x10, 0x0, 0x0])); // TODO: Size should not be hard-coded.
        })
  
        .catch((error) => {
          throw error;
        });
        break;
      default:
        throw new Error(`Unknwon response op-code received: ${controlOpCodeToString(responseOpCode)}.`);
    }
  }
  
  
  function doDFU() {
    deviceDiscover()
    .then((result) => {
      gatt = result;
      return enableNotifications(gatt.controlPointCharacteristic, controlPointNotificationHandler);
    })
    .then(() => gatt.controlPointCharacteristic.writeValue(
      new Uint8Array([CONTROL_OPCODES.SELECT, CONTROL_PARAMETERS.COMMAND_OBJECT])))
    .catch((error) => {
      throw error;
    });
  }

