let drop_zone = document.querySelector("#drop_zone");
let file_button = document.querySelector("#file_button");

const KNOWN_LICENSE_TAGS = [
    'OPT',
    'FFF-OPT',
    'ANON',
    'BY',
    'NC',
];

function htmlInvalid(details) {
    return `<span class="invalid">❌</span>` + (details !== `` ? `<span class="details">${details}</span>` : ``);
}

function htmlValid(details) {
    return `<span class="valid">✅</span>` + (details !== `` ? `<span class="details">${details}</span>` : ``);
}

window.addEventListener("load", (event) => {
    drop_zone.addEventListener("drop", dropHandler);
    drop_zone.addEventListener("dragover", dragOverHandler);
    drop_zone.addEventListener("dragenter", dragEnterHandler);
    drop_zone.addEventListener("dragleave", dragLeaveHandler);
    drop_zone.addEventListener("dragend", dragEndHandler);
    file_button.addEventListener("change", fileButtonChangeHandler);
    document.querySelectorAll(".known-licenses").forEach((item) => {
        item.innerHTML = KNOWN_LICENSE_TAGS
            .map(tag => {return `"${tag}"`})
            .join(", ");
    });
});

async function checkPhoto(file) {
    console.log(`filename = ${file.name}`);

    if (!checkMimetype(file)) {
        return;
    }
    checkFilename(file);
    checkFilesize(file);
    try {
        const tags = await ExifReader.load(file);
        console.log(tags);
        checkDateTimeOriginal(tags);
        checkResolution(tags);
    } catch(e) {
        console.error(e);
    }
}

function checkFilename(file) {
    let elem_valid_license = document.querySelector("#valid-license");
    let re_license = RegExp(`[-_\s]+(?<license_tag>${KNOWN_LICENSE_TAGS.join('|')})[-_\s]+`);
    if ((match = re_license.exec(file.name))) {
        elem_valid_license.innerHTML = htmlValid(`"${match.groups['license_tag']}"`);
    } else {
        elem_valid_license.innerHTML = htmlInvalid(`Zumindest keins der bekannten Kürzel mit ' ', '-' oder '_' vom Rest des Dateinamens getrennt`);
    }
}

function bytesToMiB(size) {
    return size / 1048576;
}

function checkFilesize(file) {
    let elem_valid = document.querySelector("#valid-filesize");
    let size_in_mebibytes = bytesToMiB(file.size);
    if (size_in_mebibytes < 50) {
        elem_valid.innerHTML = htmlValid(`${size_in_mebibytes.toFixed(2)}&nbsp;MiB`);
    } else {
        elem_valid.innerHTML = htmlInvalid(`${size_in_mebibytes.toFixed(2)}&nbsp;MiB`);
    }
}

function checkResolution(exif_tags) {
    let elem_valid = document.querySelector("#valid-resolution");
    const MAX_RESOLUTION = 8192;
    if (!("Image Height" in exif_tags && "Image Width" in exif_tags)) {
        elem_valid.innerHtml = htmlInvalid(`EXIF-Metadaten enthalten keine Angabe zur Auflösung`);
        return;
    }
    const res = `${exif_tags['Image Width'].value}x${exif_tags['Image Height'].value}`;
    console.log(res);
    if (exif_tags['Image Height'].value < MAX_RESOLUTION && exif_tags['Image Width'].value < MAX_RESOLUTION) {
        elem_valid.innerHTML = htmlValid(res);
    } else {
        elem_valid.innerHTML = htmlInvalid(res);
    }
}

function checkDateTimeOriginal(exif_tags) {
    let elem_valid = document.querySelector("#valid-datetimeoriginal");
    if ('DateTimeOriginal' in exif_tags) {
        elem_valid.innerHTML = htmlValid(`"${exif_tags['DateTimeOriginal'].description}"`);
    } else {
        elem_valid.innerHTML = htmlInvalid(``);
    }
}

function checkMimetype(file) {
    let elem_valid = document.querySelector("#valid-mimetype");
    if (file.type === `image/jpeg`) {
        elem_valid.innerHTML = htmlValid(``);
        return true;
    }
    elem_valid.innerHTML = htmlInvalid(file.type);
    return false;
}

function fileButtonChangeHandler() {
    for (const file of file_button.files) {
        checkPhoto(file);
    }
}

function dropHandler(ev) {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    drop_zone.classList.remove('over');

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...ev.dataTransfer.items].forEach((item, i) => {
            console.log("DataTransferItemList");
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                const file = item.getAsFile();
                checkPhoto(file);
            }
        });
    } else {
        // Use DataTransfer interface to access the file(s)
        [...ev.dataTransfer.files].forEach((file, i) => {
            console.log("DataTransfer");
            checkPhoto(file);
        });
    }
}

function dragOverHandler(ev) {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    return false;
}

function dragEnterHandler(ev) {
    drop_zone.classList.add('over');
}

function dragEndHandler(ev) {
    drop_zone.classList.remove('over');
}

function dragLeaveHandler(ev) {
    drop_zone.classList.remove('over');
}