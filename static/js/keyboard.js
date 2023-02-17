const Keyboard = window.SimpleKeyboard.default;

const myKeyboard = new Keyboard({
//   onChange: input => onChange(input),
  onKeyPress: button => onKeyPress(button)
});
function onChange(input) {
//   document.querySelector(".input").value = input;
  console.log("Input changed", input);
}

function onKeyPress(button) {
  console.log("Button pressed", button);
  if (button === "{shift}" || button === "{lock}") handleShift();
  // Send the keypress
  let key = null
  if(button[0]!=="{"){
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

  
    
    // If an error occurs
    .catch(error => {

        // Print an error message in the REPL console
        replConsole.value += "\nBluetooth error. Are you connected?";

        // Move the cursor forward
        cursorPosition = replConsole.value.length;

        // Focus the cursor to the REPL console, and scroll down
        // focusREPL();

        // Log the error to the debug console
        console.error(error);
    });
  }
}
function handleShift(event) {
  let currentLayout = myKeyboard.options.layoutName;
  let shiftToggle = currentLayout === "default" ? "shift" : "default";

  /**
   * If phyisical keyboard's CapsLock is enabled
   */
  if (event && event.getModifierState("CapsLock")) {
    shiftToggle = "shift";
  }

  myKeyboard.setOptions({
    layoutName: shiftToggle
  });
}
