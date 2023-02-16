 // Load a firmware package

 
 function setPercentage(percentage) {
   const progressContainer = document.querySelector('.progress-container');
   const progressEl = progressContainer.querySelector('.progress');
   const percentageEl = progressContainer.querySelector('.percentage');
   
   progressEl.style.width = percentage+"%";
   percentageEl.innerText = percentage+"%";
   percentageEl.style.left = percentage+"%";
 }
 const updateCont = document.querySelector('.bg-overlay');
 
 function firmwareUpdateStarted(start=true){

    if(start){
        updateCont.querySelector('span').innerHTML = "Starting firmware update to "+latestVersion.innerHTML
        setPercentage(0)
        updateCont.classList.remove('off')
    }else{
        updateCont.querySelector('span').innerHTML = "Firmware update Complete"
        setTimeout(()=>{
            updateCont.classList.add('off')

        },2000)
    }

 }

 var package = null
 function setPackage(file) {
    if (!file) return;

    package = new SecureDfuPackage(file);
    package.load()
    .then(() => {
        // setStatus(`Firmware package: ${file.name}`);
        // selectEl.style.visibility = "visible";
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
        console.log(event);
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
            updateCont.querySelector('span').innerHTML = "firmware updating to "+latestVersion.innerHTML

            // setStatus(`Updating ${image.type}: ${image.imageFile}...`);
            return dfu.update(device, image.initData, image.imageData);
        }
    })
    .then(() => {
        firmwareUpdateStarted(false)
        console.log("Update complete!");
        // setTransfer();
        // fileEl.value = "";
    })
    .catch(error => {
        console.log(error)
        updateCont.querySelector('span').innerHTML = "firmware updating to "+latestVersion.innerHTML +" failed"
        // statusEl.style.visibility = "hidden";
        // setStatus(error);
    });
}

async function doDFU() {
    // first download and parse zip
   await fetch(latestVersion.getAttribute('data-zip-url')).then(data=>{
    // let zipFile = new Blob(d,{type:"application/zip"})
    data.blob().then(d=>{
      setPackage(d)
      selectDevice()
    })
   })
}
