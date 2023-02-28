import {replHandleKeyPress} from "./repl.js";

const replConsole = document.getElementById('replConsole');
const keyBoardUi = document.querySelector('.simple-keyboard')
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
            key = button
        }
        if(button=="{bksp}"){
            key ="Backspace"
        }
        if(button=="{enter}"){
            key ="Enter"
        }
        if(button=="{space}"){
            key =" "
        }
        if(button=="{tab}"){
            key ="Tab"
        }
        if(key!=null){
            replHandleKeyPress(key)
        
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
    keyBoardUi.style.display= 'none'
  }
