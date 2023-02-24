
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
    menuBtn.addEventListener('click',function(){
        // window.location = "profile"
        document.querySelector('.sidebar').classList.remove('close')
        
    })
    if(nativeFunc){
        connectButton.style.display = 'none'
    }else{
        // menuBtn.innerHTML = ""
        spinner.style.display = "none"
    }
    document.querySelector('.menu-close').addEventListener('click',()=>{
        document.querySelector('.sidebar').classList.add('close')
    })
    // Variable for keeping track of the current cursor position
    let cursorPosition = 0;

    //varibales for controlling touch 
    let touchstartX = 0
    let touchendX = 0
    let touchstartY = 0
    let touchendY = 0
    let startTime = 0
    
    function checkDirection() {
        let elapsedTime = (new Date() - startTime)
        let dx =touchendX-touchstartX ;
        let dy =touchendY-touchstartY ;
        let dvx = (touchendX-touchstartX)*1000/elapsedTime ;
        let dvy = (touchendY-touchstartY)*1000/elapsedTime ;
        // console.log(`travel (${dx}, ${dy})`)
        // console.log(`speed (${dvx},${dvy})`)
        if (dy<-60) {
            // up swiped
            tabSwitch('editor')
        };
        if (dy>+60) {
            tabSwitch('terminal')
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
            }else{
                if(SYSTEM_CMDS[UPDATE_CMD]){
                    sendUartData(UPDATE_MSG + '\r\n')
                    SYSTEM_CMDS[UPDATE_CMD] = false
                }
            }
        }
       
    }
    const checkVersion = function (){
        SYSTEM_CMDS[UPDATE_CMD] = true
        sendUartData(UPDATE_CMD+"\r\n")
    }
    document.querySelector('.firmware-update')?.addEventListener('click',function(){
        SYSTEM_CMDS[UPDATE_START] = true
        sendUartData(UPDATE_START+"\r\n").catch(err=>{
            console.log(err)
        })
    })
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
        if(replConsole.value.lengh!=0){
            replConsole.value = replConsole.value + "\n";
        }
    
        // Move the cursor forward
        cursorPosition = replConsole.value.length;
        // sendUartData("\x02")
         
        setTimeout(()=>{
            // checkVersion()
            

            sendUartData("\x03"); // Send Ctrl-C to clear the prompt
            replConsole.value = '';
            cursorPosition = 0;
            sendUartData("\x02"); // Send Ctrl-B to enter friendly mode
        },500)
    
    }
    
    
    // When the connect/disconnect button is pressed
    connectButton.addEventListener('click', ()=>{
        spinner.style.display = "inline-block"
        if(nativeFunc){
            onConnectRepl()
            focusREPL();
            // sendUartData("\x03");
            // checkVersion()
            return;
        }
        connectDisconnect()
    
            // Once the promise returns
            .then(result => {
    
                // If connected 
                if (result === "connected") {
                    onConnectRepl()
                    // Send Ctrl-C to the device
                    sendUartData("\x03");
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
    })
    
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
    
                // If an error occurs
                .catch(error => {
    
                    // Print an error message in the REPL console
                    replConsole.value += "\nBluetooth error. Are you connected?";
    
                    // Move the cursor forward
                    cursorPosition = replConsole.value.length;
    
                    // Focus the cursor to the REPL console, and scroll down
                    focusREPL();
    
                    // Log the error to the debug console
                    console.error(error);
                });
                if(String(replConsole.value).endsWith("update.micropython()") && key=="\r\n"){
                    // setTimeout(doDFU,2000)
                }
            // Don't print characters to the REPL console because the response will print it for us
            event.preventDefault();
        }
    }else{
        // Whenever keys are pressed
        replConsole.onkeyup = (event) => {
            
            key = replConsole.value.slice(cursorPosition)
            if(key=="\n"){
                key = "\r\n"
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
                .catch(disconnectError);

            
        }
    }
    const appBleDisconnected = function(){
        controlButtons.forEach(ele => { ele.disabled = true;}); 
        replConsole.value  += "\nBluetooth error. Are you connected? Trying to connect!";
        cursorPosition = replConsole.value.length;
        spinner.style.display = "inline-block";
        scanTrigger()
    }
    // Whenever keys such as Ctrl, Tab or Backspace are pressed/held
    replConsole.onkeydown = (event) => {
    
        // If Ctrl is held
        if (event.ctrlKey) {
            switch (event.key) {
    
                // In the case of Ctrl-A
                case 'a':
    
                    // Send control code 01
                    sendUartData("\x01").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
    
                // In the case of Ctrl-B
                case 'b':
    
                    // Send control code 02
                    sendUartData("\x02").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                        // Return
                    return;
    
                // In the case of Ctrl-C
                case 'c':
    
                    // Send control code 03
                    sendUartData("\x03").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
    
                // In the case of Ctrl-D
                case 'd':
    
                    // Send control code 04
                    sendUartData("\x04").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
    
                // In the case of Ctrl-E
                case 'e':
    
                    // Send control code 05
                    sendUartData("\x05").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
            }
        }
    
        // If the meta/command key is held
        if (event.metaKey) {
            switch (event.key) {
    
                // In the case of Meta-K or Meta-backspace
                case 'k':
    
                    // Clear the console
                    replConsole.value = "";
    
                    // Reset the cursor position to zero
                    cursorPosition = 0;
    
                    // Send control code 03 to reset the REPL
                    sendUartData("\x03").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
    
                // In the case of Meta-backspace
                case 'Backspace':
    
                    // Send a bunch of backspaces to clear the whole line
                    sendUartData("\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
    
                // In the case of Meta-right
                case 'ArrowRight':
    
                    // Send a bunch of right arrow keys
                    sendUartData("\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C" +
                        "\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C" +
                        "\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C\x1B[C").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
    
                // In the case of Meta-left
                case 'ArrowLeft':
    
                    // Send a bunch of left arrow keys
                    sendUartData("\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D" +
                        "\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D" +
                        "\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D\x1B[D").catch(disconnectError);
    
                    // Prevent any action in the REPL console
                    event.preventDefault();
    
                    // Return
                    return;
            }
        }
    
        // If backspace is pressed
        if (event.key === 'Backspace') {
    
            // Send control code 08
            sendUartData("\x08");
    
            // Prevent any action in the REPL console
            event.preventDefault();
    
            // Return
            return;
        }
    
        // If up is pressed
        if (event.key === 'ArrowUp') {
    
            // Send control sequence ESC-[A
            sendUartData("\x1B[A").catch(disconnectError);
    
            // Prevent any action in the REPL console
            event.preventDefault();
    
            // Return
            return;
        }
    
        // If down is pressed
        if (event.key === 'ArrowDown') {
    
            // Send control sequence ESC-[B
            sendUartData("\x1B[B").catch(disconnectError);
    
            // Prevent any action in the REPL console
            event.preventDefault();
    
            // Return
            return;
        }
    
        // If right is pressed
        if (event.key === 'ArrowRight') {
    
            // Send control sequence ESC-[C
            sendUartData("\x1B[C").catch(disconnectError);
    
            // Prevent any action in the REPL console
            event.preventDefault();
    
            // Return
            return;
        }
    
        // If left is pressed
        if (event.key === 'ArrowLeft') {
    
            // Send control sequence ESC-[D
            sendUartData("\x1B[D").catch(disconnectError);
    
            // Prevent any action in the REPL console
            event.preventDefault();
    
            // Return
            return;
        }
    
        // If Tab is pressed
        if (event.key === 'Tab') {
    
            // Send control code 09
            sendUartData("\x09").catch(disconnectError);
    
            // Prevent any action in the REPL console
            event.preventDefault();
    
            // Return
            return;
        }
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
    function pasteEvent() {
    
        // Read the clipboard
        navigator.clipboard.readText()
            .then(text => {
    
                // Send the entire clipboard, with line-feeds replaced with CRLF
                sendUartData(text.replace('\n', '\r\n'))
    
                    // If an error occurs
                    .catch(disconnectError);
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
    
        // For every character in the incoming string (i is incremented internally)
        for (let i = 0; i < string.length;) {
    
            // Check if there's a backspace character at the current position
            if (string.indexOf('\b', i) == i) {
    
                // Move the cursor back by one space
                cursorPosition--;
    
                // Skip past the backspace character
                i += '\b'.length;
            }
    
            // Check if there is a carriage return at the current position
            else if (string.indexOf('\r', i) == i) {
    
                // Skip past the carriage return character
                i += '\r'.length;
            }
    
            // Check if there's an ESC-[K sequence at the current position
            else if (string.indexOf('\x1B[K', i) == i) {
    
                // Remove everything from the cursor to the end of the string
                replConsole.value = replConsole.value.slice(0, cursorPosition);
    
                // Skip ahead past the ESC-[K
                i += '\x1B[K'.length;
            }
    
            // Check if there's an ESC-[nD sequence at the current position
            else if (string.slice(i).search(/\x1B\[\d+D/) == 0) {
    
                // Extract the number of spaces to move
                let backspaces = parseInt(string.slice(i).match(/(\d+)(?!.*\1)/g));
    
                // Move the cursor back that many spaces
                cursorPosition -= backspaces;
    
                // Skip ahead past the ESC-[nD
                i += '\x1B[D'.length + String(backspaces).length;
            }
    
            // Otherwise for all other characters
            else {
    
                // Append the output with the new character
                replConsole.value = replConsole.value.slice(0, cursorPosition)
                    + string[i]
                    + replConsole.value.slice(cursorPosition + 1);
    
                // Move the cursor forward by one space
                cursorPosition++;
    
                // Skip one character
                i++;
            }
            }
    
            // Reposition the cursor
            replConsole.selectionEnd = cursorPosition;
            replConsole.selectionStart = cursorPosition;
    
            // Make sure the REPL console is scrolled all the way down
            replConsole.scrollTop = replConsole.scrollHeight;
            systemCMDHook(string)
    }
    // Whenever data arrives over bluetooth
    function receiveUartData(event) {
    
        // Decode the byte array into a UTF-8 string
        const decoder = new TextDecoder('utf-8');
        let value = event.target.value;
        let string = decoder.decode(value);
        uartStringDataHandler(string)
        focusREPL()
        
    }
    // Whenever raw data arrives over bluetooth
    function receiveRawData(event) {
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
    function disconnectHandler() {
    
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

const tabSwitch = function(tab){
    if(tab=='terminal'){
        // document.querySelector('.tab.console-btn').classList.add('active')
        // document.querySelector('.tab.editor-btn').classList.remove('active')
        document.querySelector('.console-area').classList.remove('off')
        document.querySelector('.file_editor').classList.add('off')
    }else if(tab=='editor'){
        // document.querySelector('.tab.console-btn').classList.remove('active')
        // document.querySelector('.tab.editor-btn').classList.add('active')
        document.querySelector('.console-area').classList.add('off')
        document.querySelector('.file_editor').classList.remove('off')

    }
}

function scanTrigger(){
    let intervalIdForScan = setInterval(()=>{
        // console.log("ok")
        if(spinner.style.display!='none'){
            sendUartData("\x03")
        }else{
            clearInterval(intervalIdForScan)
        }
    },5000)
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
