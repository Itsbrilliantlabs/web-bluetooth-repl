
 const updateCont = document.querySelector('.bg-overlay');
 
 function setPercentage(percentage) {
    const progressContainer = document.querySelector('.progress-container');

   const progressEl = progressContainer.querySelector('.progress');
   const percentageEl = progressContainer.querySelector('.percentage');

   progressEl.style.width = percentage+"%";
   percentageEl.innerText = percentage+"%";
   percentageEl.style.left = percentage+"%";
   document.getElementById('update-start-btn').style.display = 'block'
   document.getElementById('update-cancel-btn').innerHTML = 'Cancel'
   document.getElementById('update-start-btn').innerHTML = 'Start Update'
   
 }
 function toggleUpdateButtons(on=true){
    
    const progressContainer = document.querySelector('.progress-container');

 const updateBtn = progressContainer.parentNode.querySelector('.update-group');
    if(on){
        progressContainer.style.display = "none";
        updateBtn.style.display = "block"
   }else{
        progressContainer.style.display = "block";
        updateBtn.style.display = "none"
   }
 }
 function firmwareUpdateStarted(start=true){

    if(start){
        toggleUpdateButtons(false)
        document.querySelector('.firmware-update-box span').innerHTML = "Starting firmware update to "+latestVersion.innerHTML
        // setPercentage(0)
        // updateCont.classList.remove('off')
    }else{
        toggleUpdateButtons(true)
        document.querySelector('.firmware-update-box span').innerHTML = "Firmware update Complete"
 
    }

 }
 setPercentage(0)
 var package = null
 function setPackage(file,callBack=false) {
    if (!file) return;

    package = new SecureDfuPackage(file);
    package.load()
    .then(() => {
        // setStatus(`Firmware package: ${file.name}`);
        // selectEl.style.visibility = "visible";
        document.querySelector('.firmware-update-box span').innerHTML = "Firmware found "+latestVersion.innerHTML+". After start Select DfuTarg as Device"

        console.log(`Firmware package: ${file.name}`)
        if(callBack){

            callBack()
           
        }else{
            toggleUpdateButtons(true)
        }
        updateCont.classList.remove('off')
       
    })
    .catch(error => {
        // selectEl.style.visibility = "hidden";
        // statusEl.style.visibility = "hidden";
         console.log(error);
    });
}

// Choose a device
function selectDevice(device=false) {
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

    if(device){
        return update(dfu, device);
    }
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
        document.querySelector('.firmware-update-box span').innerHTML = "firmware updating to "+latestVersion.innerHTML +" failed: "+String(error)
        document.getElementById('update-start-btn').innerHTML = 'Try Again'
        toggleUpdateButtons(true)
    });
}

async function doDFU(afterPackageLoad=false) {
    // first download and parse zip
   await fetch(latestVersion.getAttribute('data-zip-url')).then(async data=>{
    // let zipFile = new Blob(d,{type:"application/zip"})
    await data.blob().then(d=>{
      setPackage(d,afterPackageLoad)
    })
   })
}


