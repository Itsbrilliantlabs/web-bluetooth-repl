 // Load a firmware package

 const updateCont = document.querySelector('.bg-overlay');
 
 function setPercentage(percentage) {
   const progressContainer = document.querySelector('.progress-container');
   const progressEl = progressContainer.querySelector('.progress');
   const percentageEl = progressContainer.querySelector('.percentage');
   const updateBtn = progressContainer.parentNode.querySelector('.update-group');
   progressEl.style.width = percentage+"%";
   percentageEl.innerText = percentage+"%";
   percentageEl.style.left = percentage+"%";
   document.getElementById('update-start-btn').style.display = 'block'
   document.getElementById('update-cancel-btn').innerHTML = 'Cancel'
   document.getElementById('update-start-btn').innerHTML = 'Start Update'
   if(percentage==0 || percentage==100){
        progressContainer.style.display = "none";
        updateBtn.style.display = "block"
   }else{
        progressContainer.style.display = "block";
        updateBtn.style.display = "none"
   }
 }
 
 function firmwareUpdateStarted(start=true){

    if(start){
        document.querySelector('.firmware-update-box span').innerHTML = "Starting firmware update to "+latestVersion.innerHTML
        // setPercentage(0)
        // updateCont.classList.remove('off')
    }else{
        document.querySelector('.firmware-update-box span').innerHTML = "Firmware update Complete"
 
    }

 }
 setPercentage(0)
 function firmwareFound(){
    document.querySelector('.firmware-update-box span').innerHTML = "Firmware found "+latestVersion.innerHTML+". After start Select DfuTarg as Device"
    setPercentage(0)
    updateCont.classList.remove('off')
 }
 var package = null
 function setPackage(file) {
    if (!file) return;

    package = new SecureDfuPackage(file);
    package.load()
    .then(() => {
        // setStatus(`Firmware package: ${file.name}`);
        // selectEl.style.visibility = "visible";
      firmwareFound()
        console.log(`Firmware package: ${file.name}`)
    })
    .catch(error => {
        // selectEl.style.visibility = "hidden";
        // statusEl.style.visibility = "hidden";
         console.log(error);
    });
}

// Choose a device
function selectDevice() {
    // setStatus("Selecting device...");
    // setTransfer();

    const dfu = new SecureDfu(CRC32.buf);
    dfu.addEventListener("log", event => {
        console.log(event.message);
    });
    dfu.addEventListener("progress", event => {
        // console.log(event);
        setPercentage(Math.floor(event.currentBytes*100/event.totalBytes))
    });

    dfu.requestDevice(true)
    .then(device => {
        if (!device) {
            
            // setStatus("DFU mode set, select device again");
            console.log("DFU mode set, select device again")
            return;
        }
        return update(dfu, device);
    })
    .catch(error => {
        console.log(error)
        // statusEl.style.visibility = "hidden";
        // setStatus(error);
    });
}

// Update a device with all firmware from a package
function update(dfu, device) {
    if (!package) return;
    firmwareUpdateStarted()
    Promise.resolve()
    .then(() => package.getBaseImage())
    .then(image => {
        if (image) {

            // setStatus(`Updating ${image.type}: ${image.imageFile}...`);
            return dfu.update(device, image.initData, image.imageData);
        }
    })
    .then(() => package.getAppImage())
    .then(image => {
        if (image) {
            document.querySelector('.firmware-update-box span').innerHTML = "firmware updating to "+latestVersion.innerHTML

            // setStatus(`Updating ${image.type}: ${image.imageFile}...`);
            return dfu.update(device, image.initData, image.imageData);
        }
    })
    .then(() => {
        console.log("Update complete!");
        document.getElementById('update-start-btn').style.display = 'none'
        document.getElementById('update-cancel-btn').innerHTML = 'Connect'
        firmwareUpdateStarted(false)

    })
    .catch(error => {
        console.log(error)
        document.querySelector('.firmware-update-box span').innerHTML = "firmware updating to "+latestVersion.innerHTML +" failed"
        document.getElementById('update-start-btn').innerHTML = 'Try Again'
        setPercentage(0)
    });
}

async function doDFU() {
    // first download and parse zip
   await fetch(latestVersion.getAttribute('data-zip-url')).then(data=>{
    // let zipFile = new Blob(d,{type:"application/zip"})
    data.blob().then(d=>{
      setPackage(d)
    })
   })
}

function cancelUpdate(){
    updateCont.classList.add('off')
    initiatWebBleConnect()
}
