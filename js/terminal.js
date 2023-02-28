import {connectDisconnect, sendUartData} from "./bluetooth.js"
import { getLatestGitTag ,} from "./gitutils.js";

String.prototype.nthLastIndexOf = function(searchString, n){
    let str = this;
    if(str === null) {
        return -1;
    }
    if(!n || isNaN(n) || n <= 1){
        return str.lastIndexOf(searchString);
    }
    n--;
    return str.lastIndexOf(searchString, str.nthLastIndexOf(searchString, n) - 1);
}

const nativeFunc = window.ReactNativeWebView?.postMessage||false; 
const keyBoardUi = document.querySelector('.simple-keyboard')
if(nativeFunc){
    connectButton.remove()
    menuBtn.addEventListener('click',function(){
        window.ReactNativeWebView.postMessage("/menu")
    })
}else{
    
    // menuBtn.addEventListener('click',function(){
    //     // window.location = "profile"
    //     document.querySelector('.sidebar').classList.remove('close')
        
    // })
    menuBtn.innerHTML = ""
    spinner.style.display = "none"
}

let touchstartX = 0
let touchendX = 0
let touchstartY = 0
let touchendY = 0
let startTime = 0
// Variables for handling raw REPL responses
var catchResponseFlag = false;
var catchResponseString = "";

// Variables regarding current firmware version and repo link
var latestGitTag = "";
var gitRepoLink = "";
const infoText = document.getElementById('infoText');
function checkDirection() {
    let elapsedTime = (new Date() - startTime)
    console.log(`(${touchendX-touchstartX}, ${touchendY-touchstartY})`)
    console.log(`(${(touchendX-touchstartX)*1000/elapsedTime} x_px/s,${(touchendY-touchstartY)*1000/elapsedTime} y_px/s)`)
    if (touchendX < touchstartX) {
        // left swiped
        document.querySelector('.sidebar')?.classList.add('close')
    };
    if (touchendX > touchstartX+80) {
        // right swiped
        // document.querySelector('.sidebar')?.classList.remove('close')
    };
}

// document.addEventListener('touchstart', e => {
//     // console.log(e)
// startTime = new Date()
// touchstartX = e.changedTouches[0].screenX
// touchstartY = e.changedTouches[0].screenY
// })

// document.addEventListener('touchend', e => {
// touchendX = e.changedTouches[0].screenX
// touchendY = e.changedTouches[0].screenY
// checkDirection()
// })
// Variable for keeping track of the current cursor position
let cursorPosition = 0;
const ctrlAButton = document.getElementById('ctrlAButton');
const ctrlBButton = document.getElementById('ctrlBButton');
const ctrlCButton = document.getElementById('ctrlCButton');
const ctrlDButton = document.getElementById('ctrlDButton');
const ctrlEButton = document.getElementById('ctrlEButton');
const clearButton = document.getElementById('clearButton');
const cancelUpdateButton = document.getElementById('update-cancel-btn');

const SYSTEM_CMDS = {}
const UPDATE_CMD = "import device;print(device.VERSION)"
const UPDATE_START = "import update;update.micropython()"
const UPDATE_MSG = 'import display as d;d.fill(0);d.text("New update available!",120,150,0xffffff);d.text("Check app for details",115,200,0xffffff);d.show();del(d)'
const systemCMDHook = function(string){
    let sep_char_cmd = '\n>>> '
    let sep_char_cmd_resp = '\n'
    let last_cmd_start_index = replConsole.value.nthLastIndexOf(sep_char_cmd,2)
    let last_cmd_end_index = replConsole.value.nthLastIndexOf(sep_char_cmd,1)
    let last_cmd = replConsole.value.slice(last_cmd_start_index+sep_char_cmd.length,last_cmd_end_index)
    let cmd_resp_sep_index = last_cmd.nthLastIndexOf(sep_char_cmd_resp,1)
    const cmd = last_cmd.slice(0,cmd_resp_sep_index)
    const cmd_response = last_cmd.slice(cmd_resp_sep_index+1)
    // }

    // app command specific logics
    if(cmd && cmd.trim().includes(UPDATE_CMD)){
        if(cmd_response.includes(latestVersion.innerHTML.trim())){
            document.querySelector('.update-start').innerHTML = "Use <b>device.VERSION</b>"
        }else{
            document.querySelector('.update-start').innerHTML = "Click <a href='#' " +
            "onclick='startMonocleFirmwareUpdate();return false;'>" +
            "here</a> to update."
            // if(SYSTEM_CMDS[UPDATE_CMD]){
            //     sendUartData(UPDATE_MSG + '\r\n')
            //     SYSTEM_CMDS[UPDATE_CMD] = false
            // }
        }
    }
}
// document.querySelector('.update-start').addEventListener('click',function(){
//     // if(device){
//         // sendUartData(UPDATE_START+"\r\n")
//         // doDFU()
//     // }
// })
const checkVersion = function (){
    SYSTEM_CMDS[UPDATE_CMD] = true
    sendUartData(UPDATE_CMD+"\r\n")
}
// When the page loads
window.addEventListener("load", (event) => {
    replConsole.placeholder = replPlaceholderText;
});

const clearConsole = () =>{
    replConsole.value = '';
        cursorPosition = 0;
    sendUartData('\x03');
    focusREPL();
}
//on connect actions
const onConnectRepl = () => {
     // Prepare for automated command handling
    catchResponseFlag = true;
    spinner.style.display = "none"

    // Clear placeholder text in the REPL console
    replConsole.placeholder = "";

    // Change the button text to "Disconnect"
    connectButton.innerHTML = "Disconnect";

    // Enable the control buttons
    controlButtons.forEach(ele => {
        ele.disabled = false;
    })

    // Print "connected" in the REPL console
    if(!replConsole.value.length==0){
        replConsole.value = replConsole.value + "\n";
    }
    // Move the cursor forward
    cursorPosition = replConsole.value.length;
    sendUartData("\x02")
    setTimeout(()=>{
         // Enter raw REPL mode to get device info and suggest updates
         sendUartData("\x03"); // Send Ctrl-C to clear the prompt
         sendUartData("\x01"); // Send Ctrl-A to enter RAW mode
         sendUartData("import device\r\n");
         sendUartData("print(device.GIT_REPO)\r\n");
         sendUartData("\x04"); // Send Ctrl-D to execute
    },500)

}

async function processCaughtResponse(string) {

    console.log("Background REPL response");
    console.log(string);

    let exitRawReplModeFlag = false;

    if (string.includes("no module named 'device'") ||
        string.includes("no attribute 'GIT_REPO'")) {

        infoText.innerText = "Could not automatically detect the device. " +
            "Automation features may not be available. Be sure to update " +
            "your device to receive these latest improvements."

        exitRawReplModeFlag = true;
    }

    if (string.includes("https://github.com/")) {

        gitRepoLink = string.substring(string.indexOf("https"),
            string.lastIndexOf('\r\n'));

        let owner = gitRepoLink.split('/')[3];
        let repo = gitRepoLink.split('/')[4];

        latestGitTag = await getLatestGitTag(owner, repo);

        // Check the device version
        sendUartData("print('VERSION='+device.VERSION)\r\n");
        sendUartData("\x04");
    }

    if (string.includes("VERSION=")) {

        let currentVersion =
            string.substring(string.indexOf("=v") + 1, string.lastIndexOf("\r\n"));

        if ((currentVersion != latestGitTag) &&
            gitRepoLink.includes("monocle")) {

            // Show update message on the display
            sendUartData("import display\r\n");
            sendUartData("display.text('New firmware available',100,180,0xffffff)\r\n");
            sendUartData("display.show()\r\n");
            sendUartData("print('NOTIFIED UPDATE')\r\n");
            sendUartData("\x04");
            let latestVersion = document.getElementById('latestVersion');
            infoText.innerHTML = "Click <a href='#' " +
                "onclick='startMonocleFirmwareUpdate();return false;'>" +
                "here</a> to update.";
            document.querySelector('.build-info').style.display = 'block'
        }

        else {
            infoText.innerHTML = "";
            exitRawReplModeFlag = true;
        }
    }

    if (string.includes("NOTIFIED UPDATE")) {
        // Wait until the previous commands are fully processed
        exitRawReplModeFlag = true;
    }

    if (string.includes("UPDATE STARTED")) {
        // Wait until the update commands are fully processed
        exitRawReplModeFlag = true;
    }

    if (exitRawReplModeFlag) {

        // Clear the screen
        replConsole.value = '';
        cursorPosition = 0;

        sendUartData("\x03"); // Send Ctrl-C to clear the prompt
        sendUartData("\x02"); // Send Ctrl-B to enter friendly mode

        catchResponseFlag = false;
    }
}
// When the connect/disconnect button is pressed
connectButton.addEventListener('click', ()=>{
    spinner.style.display = "inline-block"

    if(nativeFunc){
        onConnectRepl()
        focusREPL();
        sendUartData("\x03");
        // checkVersion()
        return;
    }
    // if(localStorage.getItem('updateInprogess')==1){
    //     if(confirm("Continue failed Update")){
    //         doDFU()
    //         return;
    //     }else{
    //         localStorage.setItem('updateInprogess',0)
    //     }
    // }
    initiatWebBleConnect()
})

ctrlAButton.addEventListener('click', () => {
    sendUartData('\x01');
    replConsole.focus()
});

ctrlBButton.addEventListener('click', () => {
    sendUartData('\x02');
    replConsole.focus()
});

ctrlCButton.addEventListener('click', () => {
    sendUartData('\x03');
    replConsole.focus()
});

ctrlDButton.addEventListener('click', () => {
    sendUartData('\x04');
    replConsole.focus()
});

ctrlEButton.addEventListener('click', () => {
    sendUartData('\x05');
    replConsole.focus()
});

clearButton.addEventListener('click', () => {
    replConsole.value = '';
    cursorPosition = 0;
    sendUartData('\x03');
    replConsole.focus();
});

cancelUpdateButton.addEventListener('click', () => {
    updateCont.classList.add('off')
    initiatWebBleConnect()
})

const initiatWebBleConnect = function(){
    spinner.style.display = "inline-block"

    connectDisconnect()

    // Once the promise returns
    .then(result => {

        // If connected 
        if (result === "connected") {
            onConnectRepl()
            // Send Ctrl-C to the device
            // sendUartData("\x03");
            // checkVersion()
            // Focus the cursor to the REPL console, and scroll down
            focusREPL();
        }
    })

    // If we couldn't connect
    .catch(error => {

        // Print an error message in the REPL console
        replConsole.value = replConsole.value + "\nCanceled, or couldn't connect. Are you using Chrome?";

        // Move the cursor forward
        cursorPosition = replConsole.value.length;

        // Focus the cursor to the REPL console, and scroll down
        focusREPL();

        // Log the error to the debug console
        console.error(error);
        spinner.style.display = "none"

    })
}
 //android keys not emmiting events
 if(!nativeFunc){
    // Whenever keys are pressed
    replConsole.onkeypress = (event) => {

        // Create a mutable copy of the event.key value
        let key = event.key;

        // If Enter is pressed
        if (key === 'Enter') {

            // Move cursor to the end of the line
            cursorPosition = replConsole.value.length;

            // Replace it with CRLF
            key = "\r\n";
        }

        // Send the keypress
        sendUartData(key)
        // Don't print characters to the REPL console because the response will print it for us
        event.preventDefault();
        if(String(replConsole.value).endsWith("update.micropython()") && key=="\r\n"){
            doDFU()
        }
    }
}else{
    // Whenever keys are pressed
    replConsole.onkeyup = (event) => {
        
        key = replConsole.value.slice(cursorPosition)
        if(key=="\n"){
            key = "\r\n"
            key = "\x1B[F\r\n"; // Send End key before sending \r\n

        }
        if(key==""){
            key="\x08";
            return;
        }

        // Don't print characters to the REPL console because the response will print it for us
        // event.preventDefault();
        replConsole.value = replConsole.value.slice(0, cursorPosition);

        // Send the keypress
        sendUartData(key)

            // If an error occurs
            // .catch(disconnectError);
       
        
    }
}
const appBleDisconnected = function(){
    controlButtons.forEach(ele => { ele.disabled = true;}); 
    replConsole.value  += "\nBluetooth error. Are you connected? Trying to connect!";
    cursorPosition = replConsole.value.length;
    spinner.style.display = "inline-block"
}
// Whenever keys such as Ctrl, Tab or Backspace are pressed/held
replConsole.onkeydown = (event) => {

    // If Ctrl is held
    if (event.ctrlKey) {
        switch (event.key) {

            // In the case of Ctrl-A
            case 'a':

                // Send control code 01
                sendUartData("\x01")
                // .catch(disconnectError);

                // Prevent any action in the REPL console
                event.preventDefault();

                // Return
                return;

            // In the case of Ctrl-B
            case 'b':

                // Send control code 02
                sendUartData("\x02")
                // .catch(disconnectError);

                // Prevent any action in the REPL console
                event.preventDefault();

                    // Return
                return;

            // In the case of Ctrl-C
            case 'c':

                // Send control code 03
                sendUartData("\x03")
                // .catch(disconnectError);

                // Prevent any action in the REPL console
                event.preventDefault();

                // Return
                return;

            // In the case of Ctrl-D
            case 'd':

                // Send control code 04
                sendUartData("\x04")
                // .catch(disconnectError);

                // Prevent any action in the REPL console
                event.preventDefault();

                // Return
                return;

            // In the case of Ctrl-E
            case 'e':

                // Send control code 05
                sendUartData("\x05")
                // .catch(disconnectError);

                // Prevent any action in the REPL console
                event.preventDefault();

                // Return
                return;
        }
    }

    // If the meta/command key is held
    if (event.metaKey) {
        switch (event.key) {

            case 'a':
                sendUartData("\x01"); // Send Ctrl-A
                break;;

            case 'b':
                sendUartData("\x02"); // Send Ctrl-B
                break;;

            case 'c':
                sendUartData("\x03"); // Send Ctrl-C
                break;;

            case 'd':
                sendUartData("\x04"); // Send Ctrl-D
                break;;

            case 'e':
                sendUartData("\x05"); // Send Ctrl-E
                break;;

            case 'v':
                // Allow pasting
                return;
        }
    }

    switch (event.key) {

        case 'Backspace':
            sendUartData("\x08"); // Send backspace
            break;

        case 'ArrowUp':
            sendUartData("\x1B[A"); // Send up arrow key
            break;

        case 'ArrowDown':
            sendUartData("\x1B[B"); // Send down arrow key
            break;

        case 'ArrowRight':
            sendUartData("\x1B[C"); // Send right arrow key
            break;

        case 'ArrowLeft':
            sendUartData("\x1B[D"); // Send left arrow key
            break;

        case 'Tab':
            sendUartData("\x09"); // Send Tab key
            break;

        case 'Enter':
            // sendUartData("\x1B[F\r\n"); // Send End key before sending \r\n
            break;

        default:
            // Only printable keys
            // if (event.key.length == 1) {
            //     sendUartData(event.key)
            // }
            break;
    }
    // event.preventDefault()
}

const disconnectError = error => {

    // Print an error message in the REPL console
    replConsole.value += "\nBluetooth error. Are you connected?";

    // Move the cursor forward
    cursorPosition = replConsole.value.length;

    // Focus the cursor to the REPL console, and scroll down
    focusREPL();

    // Log the error to the debug console
    console.error(error);
}
// Handle pasting of text into the REPL
replConsole.onpaste = function () {

    // Read the clipboard
    navigator.clipboard.readText()
        .then(text => {

            // Send the entire clipboard, with line-feeds replaced with CRLF
            sendUartData(text.replace('\n', '\r\n'))
            
                // If an error occurs
                // .catch(disconnectError);
        })

        // Catch any errors
        .catch(() => {

            // Print a message in the REPL console
            replConsole.value = replConsole.value + "\nCould not paste. Did you allow clipboard permissions?";

            // Move the cursor forward
            cursorPosition = replConsole.value.length;

            // Send Ctrl-C to the device
            sendUartData("\x03");

            // Focus the cursor to the REPL console, and scroll down
            focusREPL();
        });
}


function uartStringDataHandler(string){

    // If catching raw REPL responses, handle separately
    if (catchResponseFlag) {

        // Concat the string until '>' appears
        catchResponseString += string;

        if (catchResponseString.slice(-1) === '>') {

            processCaughtResponse(catchResponseString);

            catchResponseString = "";
        }

        return;
    }

    // For every character in the string, i is incremented internally
    for (let i = 0; i < string.length;) {

        // Move cursor back one if there is a backspace
        if (string.indexOf('\b', i) == i) {

            cursorPosition--;
            i += '\b'.length;
        }

        // Skip carriage returns. We only need newlines '\n'
        else if (string.indexOf('\r', i) == i) {

            i += '\r'.length;
        }

        // ESC-[K deletes to the end of the line
        else if (string.indexOf('\x1B[K', i) == i) {

            replConsole.value = replConsole.value.slice(0, cursorPosition);
            i += '\x1B[K'.length;
        }

        // ESC-[nD moves backwards n characters
        else if (string.slice(i).search(/\x1B\[\d+D/) == 0) {

            // Extract the number of spaces to move
            let backspaces = parseInt(string.slice(i).match(/(\d+)(?!.*\1)/g));
            cursorPosition -= backspaces;
            i += '\x1B[D'.length + String(backspaces).length;
        }

        // Append other characters as normal
        else {

            replConsole.value = replConsole.value.slice(0, cursorPosition)
                + string[i]
                + replConsole.value.slice(cursorPosition + 1);

            cursorPosition++;
            i++;
        }
    }

    // Reposition the cursor
    replConsole.selectionEnd = cursorPosition;
    replConsole.selectionStart = cursorPosition;

    replConsole.scrollTop = replConsole.scrollHeight;
        systemCMDHook(string)
}
// Whenever data arrives over bluetooth
export function receiveUartData(event) {

    // Decode the byte array into a UTF-8 string
    const decoder = new TextDecoder('utf-8');
    let value = event.target.value;
    let string = decoder.decode(value);
    uartStringDataHandler(string)
    focusREPL()
    
}
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
    let img = document.querySelector(IMG_TAG);
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

// Whenever a disconnect event occurs
export function disconnectHandler() {

    // Print "disconnected" in the REPL console
    replConsole.value = replConsole.value + "\nDisconnected";
    spinner.style.display = "none"
    
    // Move the cursor forward
    cursorPosition = replConsole.value.length;

    // Focus the cursor to the REPL console, and scroll down
    focusREPL();

    // Show "Connect"
    connectButton.innerHTML = "Connect";

    // Disable all the buttons again
    controlButtons.forEach(ele => {
        ele.disabled = true;
    })
}

// Helper function to ensure the REPL console is scrolled down and focused
function focusREPL() {
    // Focus the cursor to the REPL console
    replConsole.focus();

    // Make sure the REPL console is scrolled all the way down
    replConsole.scrollTop = replConsole.scrollHeight;
}


// const arrowToggleBtn = document.querySelector('.arrow-toggle span')
// const arrowPad = document.querySelector(".arrow-pad")
// const consoleControl = document.querySelector('.arrow-pad')

replConsole.addEventListener('focusout',()=>{
    if(nativeFunc){
        replConsole.setAttribute("rows",20)
    }
    // consoleControl.classList.remove("blur")
    // arrowToggleBtn.parentNode.classList.remove("blur")
    
})
replConsole.addEventListener('focus',()=>{
    if(nativeFunc){
        replConsole.setAttribute("rows",18)
    }
    // consoleControl.classList.add("blur")
    // arrowToggleBtn.parentNode.classList.add("blur")
})

window.startMonocleFirmwareUpdate = () => {

    catchResponseFlag = true;

    sendUartData("\x03"); // Send Ctrl-C to clear the prompt
    sendUartData("\x01"); // Send Ctrl-A to enter RAW mode

    sendUartData("import display\r\n");
    sendUartData("display.text('Updating firmware...',120,180,0xffffff)\r\n");
    sendUartData("display.show()\r\n");
    sendUartData("import update\r\n");
    sendUartData("update.micropython()\r\n");
    sendUartData("print('UPDATE STARTED')\r\n");

    sendUartData("\x04"); // Send Ctrl-D to execute
    doDFU()
}
// let arrowBtns = document.querySelectorAll(".arrow")
// arrowBtns.forEach(el=>{
//     el.addEventListener("click",function(e){
//         console.log(el.getAttribute("data-cmd"))
//         switch(el.getAttribute("data-cmd")){
//             case 'UP':
//                 sendUartData("\x1B[A").catch(disconnectError);
//                 break;
//             case 'DOWN':
//                 sendUartData("\x1B[B").catch(disconnectError);
//                 break;
//             case 'LEFT':
//                 sendUartData("\x1B[D").catch(disconnectError);
//                 break;
//             case 'RIGHT':
//                 sendUartData("\x1B[C").catch(disconnectError);
//                 break;
//             default:
//                 break;

//         }
//         e.preventDefault()
//     })
// })
// arrowToggleBtn.addEventListener('click',function(){
//     arrowPad.classList.toggle("hide")
//     if(arrowPad.classList.contains("hide")){
//         arrowToggleBtn.innerHTML = "&lsaquo;"
//     }else{
//         arrowToggleBtn.innerHTML = "&rsaquo;"

//     }
// })



// from https://stackoverflow.com/questions/38241480/detect-macos-ios-windows-android-and-linux-os-with-js
function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator?.userAgentData?.platform || window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;
  
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (/Linux/.test(platform)) {
      os = 'Linux';
    }
  
    return os;
  }

  if(getOS()=='Android'){
    const Keyboard = window.SimpleKeyboard.default;

    const myKeyboard = new Keyboard({
    //   onChange: input => onChange(input),
    onKeyPress: button => onKeyPress(button),
    display: {
        '{bksp}': '⌫',
        '{off}': '&#8964;',
        '{num}':'123',
        '{abc}':'Abc',
        '{enter}': 'return',
        '{shift}' : '⇧',
        '{tab}' : '&#8677;',
        '{space}' : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    },
    mergeDisplay: true,
    
    autoUseTouchEvents: true,
    buttonTheme: [
        {
          class: "end-btns2-left",
          buttons: "a A `"
        },
        {
            class: "end-btns2-right",
            buttons: "l L ?"
          }
      ],
    layout: {
        'default': [
        '{tab} ( ) [ ] { } \\ / \' "',
        'q w e r t y u i o p',
        'a s d f g h j k l',
        '{shift} z x c v b n m {bksp}',
        '{num} , {space} . {enter}',
        '{off}'
        ],
        'shift': [
        '{tab} ( ) [ ] { } \\ / \' "',
        'Q W E R T Y U I O P',
        'A S D F G H J K L',
        '{shift} Z X C V B N M {bksp}',
        '{num} &lt; {space} &gt; {enter}',
        '{off}'
        ],
        'num': [
            '{tab} ( ) [ ] { } \\ / \' "',
            '1 2 3 4 5 6 7 8 9 0',
            '` _ * - + " : # ?',
            '{shift} ! ; @ $ % ^ &amp; {bksp}',
            '{abc} &lt; {space} &gt; {enter}',
            '{off}'
            ],
        
    }
    });

    // 'default': [
    //     '` 1 2 3 4 5 6 7 8 9 0 - =',
    //     'q w e r t y u i o p [ ] \\',
    //     '{tab} a s d f g h j k l ; \'',
    //     '{shift} z x c v b n m / {bksp}',
    //     '.com , {space} . {enter}'
    //     ],
    //     'shift': [
    //     '~ ! @ # $ % ^ &amp; * ( ) _ +',
    //     'Q W E R T Y U I O P { } |',
    //     '{tab} A S D F G H J K L : "',
    //     '{shift} Z X C V B N M &lt; &gt; ? {bksp}',
    //     '@ , {space} , {enter}'
    //     ]
    function onKeyPress(button) {
        console.log("Button pressed", button);
        if (button === "{shift}" || button === "{lock}") handleShift();
        if (button === "{num}" || button === "{abc}") handleNum();
        if (button === "{off}"){
            myKeyboard.setOptions({
                layoutName: "default"
            });
            keyBoardUi.style.display = 'none'
        };
        // Send the keypress
        let key = null
        if(button[0]!=="{" || button=="{"){
            key =button
        }
        if(button=="{bksp}"){
            sendUartData("\x08");
        }
        if(button=="{enter}"){
            key ="\r\n"
        }
        if(button=="{space}"){
            key =" "
        }
        if(button=="{tab}"){
            sendUartData("\x09")
        }
        if(key!=null){
            sendUartData(key)

        
        }
    }
    function handleShift(event) {
        let currentLayout = myKeyboard.options.layoutName;
        let shiftToggle = (currentLayout === "default") ? "shift" : "default";

        myKeyboard.setOptions({
            layoutName: shiftToggle
        });
        // let btns = document.querySelectorAll('.hg-button')
        // btns.forEach(b=>{
        //     b.style.height= String(key_height)+'px'
        // })
    }
    function handleNum(event) {
        let currentLayout = myKeyboard.options.layoutName;
        let shiftToggle = (currentLayout === "default") ? "num" : "default";
    
        myKeyboard.setOptions({
            layoutName: shiftToggle
        });
        // let btns = document.querySelectorAll('.hg-button')
        // btns.forEach(b=>{
        //     b.style.height= String(key_height)+'px'
        // })
    }
    let key_height =  40
    let console_height = 20
    if(window.screen.availHeight<800){
         key_height = 35
         console_height =16
    }
    if(window.screen.availHeight<700){
        // key_height = 25
        console_height =14
   }
    // let btns = document.querySelectorAll('.hg-button')
    // btns.forEach(b=>{
    //     b.style.height= String(key_height)+'px'
    // })
    replConsole.setAttribute("rows",console_height)
    // document.querySelector('.app').style.height = String(window.screen.availHeight - (key_height*5)-30)+"px"
    keyBoardUi.addEventListener('click',function(event){
        event.stopPropagation()
    })
    replConsole.addEventListener('focus',()=>{
        keyBoardUi.style.display = 'block'
    })
    document.addEventListener('click',function(event){
        
        // debugger
        keyBoardUi.style.display = 'none'
    })
    replConsole.addEventListener('click',function(event){
        event.stopPropagation()
        keyBoardUi.style.display = 'block'
    })
    replConsole.setAttribute('inputmode','none')
  }else{
    document.querySelector('.simple-keyboard').style.display= 'none'
  }
