import { connectDisconnect } from "./bluetooth.js";
import { replResetConsole, replSend} from "./repl.js";
import { checkForUpdates, startFirmwareUpdate } from "./update.js"

window.addEventListener("load", () => {
    replConsole.placeholder =
        "Welcome to the MicroPython Web REPL. Connect via Bluetooth using the button below.\n\n" +
        "Currently, only Chrome desktop supports Web Bluetooth which is used here.\n\n" +
        "You're welcome to fork, contribute, and suggest bugfixes for this code within the repository linked below.";
});

const spinner = document.querySelector('.lds-spinner');
const infoText = document.getElementById('infoText');
const replConsole = document.getElementById('replConsole');
const connectButton = document.getElementById('connectButton');
const controlButtons = document.getElementsByName('controlButton');
const ctrlAButton = document.getElementById('ctrlAButton');
const ctrlBButton = document.getElementById('ctrlBButton');
const ctrlCButton = document.getElementById('ctrlCButton');
const ctrlDButton = document.getElementById('ctrlDButton');
const ctrlEButton = document.getElementById('ctrlEButton');
const clearButton = document.getElementById('clearButton');

connectButton.addEventListener('click', () => {
    spinner.style.display = "inline-block"

    infoText.innerHTML = "";

    connectDisconnect()
        .then( result => {
            spinner.style.display = "none"
            if (result.status === "dfu connected") {

                connectButton.innerHTML = "Disconnect";
                infoText.innerHTML = "Starting firmware update...";
                 doDFU(()=>{
                    toggleUpdateButtons(false)
                     selectDevice(result.device)
                })
            }

            if (result.status === "repl connected") {

                replConsole.placeholder = "";
                connectButton.innerHTML = "Disconnect";

                controlButtons.forEach(element => {
                    element.disabled = false;
                })

                checkForUpdates()
                    .then(value => {
                        if (value != "") {
                            infoText.innerHTML = value + " Click <a href='#' " +
                                "onclick='update();return false;'>" +
                                "here</a> to update.";
                        }
                    })
                    .catch(error => {
                        // infoText.innerHTML = error;
                        infoText.innerHTML =  "Version Couldn't detected. Click <a href='#' " +
                        "onclick='update();return false;'>" +
                        "here</a> to update.";
                    });

                replResetConsole();
                replConsole.focus()

            }
        })

        .catch(error => {

            spinner.style.display = "none"
            console.error(error);
        })
});

ctrlAButton.addEventListener('click', () => {
    replSend('\x01');
    replConsole.focus()
});

ctrlBButton.addEventListener('click', () => {
    replSend('\x02');
    replConsole.focus()
});

ctrlCButton.addEventListener('click', () => {
    replSend('\x03');
    replConsole.focus()
});

ctrlDButton.addEventListener('click', () => {
    replSend('\x04');
    replConsole.focus()
});

ctrlEButton.addEventListener('click', () => {
    replSend('\x05');
    replConsole.focus()
});

clearButton.addEventListener('click', () => {
    replResetConsole();
    replSend('\x03');
    replConsole.focus();
});



// Whenever raw data arrives over bluetooth
export function receiveRawData(event) {
    console.log(event.target.value);

    try{
        if(appendBuffer(event.target.value.buffer)){
            showImage()
            console.log(`finished transfer: ${file_name} -  ${final_buffer.byteLength} of ${file_size}`)
            final_buffer = null;
            file_size = null;
            file_name = null;
        }else{
            console.log(`progress: ${file_name} -  ${final_buffer.byteLength} of ${file_size}`)
        }
    }catch(error){
        console.log(error)
    }
    
}

//for displaying recieved imaged
 function showImage(){
    let img_blob = new Blob([final_buffer], { type: "image/png" });
    let urlCreator = window.URL || window.webkitURL;
    let imageUrl = urlCreator.createObjectURL(img_blob);
    let img = document.querySelector("#photo");
    img.src = imageUrl;
    let a = document.createElement('a');
    a.href = imageUrl;
    a.download = file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
 }

// Image Variables
let final_buffer = null;
let file_name = null;
let file_size = null;

// concatinating data function
const appendBuffer = function (buffer) {
    let w_temp = new Uint8Array(buffer)

//FLAGS for data read
    const FILE_INDEX = w_temp[0]
    const FILE_SIZE_START = 1
    const FILE_SIZE_BITS = 4
    const FILE_NAME_LENGTH_SIZE = 5
    const FILE_NAME_LENGTH_BIT= 1

    const FILE_NAME_START = FILE_NAME_LENGTH_SIZE + FILE_NAME_LENGTH_BIT

    if (FILE_INDEX === 1 || FILE_INDEX === 0) {

        file_size = new Int32Array(w_temp.slice(FILE_SIZE_START, FILE_SIZE_START+FILE_SIZE_BITS).buffer).toString(10)
        file_name = new TextDecoder("utf-8").decode(w_temp.slice(FILE_NAME_START, w_temp[FILE_NAME_LENGTH_SIZE] + FILE_NAME_START))
        final_buffer = w_temp.slice(w_temp[FILE_NAME_LENGTH_SIZE] + FILE_NAME_START, w_temp.byteLength).buffer
    }
    if(FILE_INDEX === 2 || FILE_INDEX === 3){
        let tmp = new Uint8Array(final_buffer.byteLength + w_temp.byteLength-1);
        tmp.set(new Uint8Array(final_buffer), 0);
        tmp.set(new Uint8Array(w_temp.slice(1, w_temp.byteLength)), final_buffer.byteLength);
        final_buffer = tmp.buffer
    }

    if (FILE_INDEX === 0 || FILE_INDEX === 3) {
        return true;
        // payload finished
    }else{
        return false;
    }

};

export function disconnectHandler() {


    connectButton.innerHTML = "Connect";
    spinner.style.display = "none"
    controlButtons.forEach(element => {
        element.disabled = true;
    })
}

 window.update = () => {
    // infoText.innerHTML = "Reconnect to the DFU device to begin the update.";
    startFirmwareUpdate();
    doDFU()
}