firebase.initializeApp({
    apiKey: "AIzaSyDGUvCzXt5Xd6HSHJ9-rCN_deEPD0BxILw",
    authDomain: "demoday-83180.firebaseapp.com",
    databaseURL: "https://demoday-83180.firebaseio.com",
    projectId: "demoday-83180",
    storageBucket: "demoday-83180.appspot.com",
    messagingSenderId: "655039030434",
    appId: "1:655039030434:web:b788265f1617bdf075a3fb"
});

const database = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// Error
window.onclick = function() {
    var errorBox = document.querySelector(".error-box");
    if (event.target == errorBox) errorBox.style.display = "none";
};

document.querySelector(".error-content div").onclick = function() {
    document.querySelector(".error-box").style.display = "none";
}

var errorAlert = (msg = "Error Message.") => {
    document.querySelector(".error-box").style.display = "grid";
    document.querySelector(".error-msg").innerHTML = msg;
};



// Logged In Logistics
document.querySelector(".recipe-form").style.display = "none";
auth.onAuthStateChanged(user => {
    if (!user) {
        // User is not signed in.
        document.querySelector(".login").style.display = "block";
    } else {
        // User is signed in.
        console.log(user);
        loadForm();
    }
});

// Form
function loadForm() {
    document.querySelector(".recipe-form").style.display = "block";
    initSection("ingredient");
    initSection("instruction");

    document.getElementById("submit").onclick = function() {
        event.preventDefault();

        // check if all input[type = text] for header section is filled
        var header = document.querySelectorAll(".form-header div input");
        var headerInputs = Array.from(header).map(field => field.value.trim());

        if (headerInputs.slice(0, 1).filter(input => input.length == 0).length > 0) return errorAlert("Not all the input fields are filled.");


        // check if all input[type = text] for ingredients section is filled
        var ingredients = document.querySelectorAll(".ingredients-box div input");
        var ingredientsInputs = Array.from(ingredients).map(field => field.value.trim());

        if (ingredientsInputs.length < 1) return errorAlert("At least one ingredient must be entered.");
        else if (ingredientsInputs.filter(input => input.length == 0).length > 0) return errorAlert("Not all the input fields are filled.");
        

        // check if all input[type = text] for step section is filled
        var stepTexts = document.querySelectorAll(".instructions-box div input[type = text]");
        var stepTextsInputs = Array.from(stepTexts).map(field => field.value.trim());

        if (stepTextsInputs.length < 1) return errorAlert("At least one step must be entered.");
        else if (stepTextsInputs.filter(input => input.length == 0).length > 0) return errorAlert("Not all the input fields are filled.");


        document.querySelector(".recipe-form").style.display = "none";
        document.querySelector(".status").style.display = "block";
        document.querySelector(".status p").innerHTML = "Uploading...";

        // get files from input[type = file] in step section is filled
        var thumbnail = document.querySelector(".form-header div input[type = file]").files[0];

        var stepFiles = document.querySelectorAll(".instructions-box div input[type = file]");
        var stepFilesInputs = Array.from(stepFiles).map(field => field.files[0]);

        var videoFile = document.querySelector(".form-video div input[type = file]").files[0];

        // uploading
        var PROGRESS = {
            value: [],
            log(idx, state) {
                this.value[idx] = state;

                if (this.value.filter(prog => prog == "f").length > 0) {
                    // if there is one thing that failed
                    (function deleteRecipe() {
                        database.ref(`recipes/${recipeId}`).set({}, err => {
                            if (err) deleteRecipe();
                        });
                    })();

                    // say upload failed
                    document.querySelector(".status p").innerHTML = "Upload Failed.";
                    document.querySelector(".recipe-form").style.display = "block";
                    document.querySelector(".status").style.display = "none";
                    console.log(PROGRESS);
                    errorAlert("Recipe Upload Failed. Please try again");
                } else if (this.value.filter(prog => prog == "p").length < 1) {
                    // if all values are "c", then upload is complete
                    document.querySelector(".status p").innerHTML = "Upload Complete!";

                    var a = document.createElement("a");
                    a.innerHTML = "Submit Another Recipe";
                    a.setAttribute("href", "index.html");
                    document.querySelector(".status").appendChild(a);
                }
            }
        };
        for (var i=0; i<(9+stepFilesInputs.length+(ingredientsInputs.length/2)+stepTextsInputs.length); i++)
            PROGRESS.value.push("p");

        var recipeId = database.ref("recipes/").push().key;
        database.ref(`recipes/${recipeId}`).set({
            "name": headerInputs[0],
            "user": auth.getUid(),
            "date": `${new Date().getTime()}`,
            "description": headerInputs[1],
            "thumbnail": ((thumbnail) ? `images/${recipeId}/${thumbnail.name}` : "images/sample/sample.png"),
            "reviews": {
                "community": {
                    "reviewed": "NO",
                    "average": "NO_RATING"
                    // "raters": {}
                },
                "photo": {
                    "reviewed": "NO",
                    "average": "NO_RATING"
                    // "raters": {}
                }
            },
            "videos": {
                "creator": {
                    "created": "NO",
                    "url": "NO_URL"
                },
                "community": {
                    "created": "NO"
                    // "users": {}
                }
            }
        }, err => {
            if (err) {
                errorAlert(err);
                PROGRESS.log(0, "f");
            } else {
                PROGRESS.log(0, "c");
                // recipe successfully uploaded
                database.ref(`users/${auth.getUid()}/recipes/submissions`).push({
                    "id": recipeId
                }, err => {
                    if (err) {
                        errorAlert(err);
                        PROGRESS.log(1, "f");
                    } else PROGRESS.log(1, "c");
                });

                if (videoFile) {
                    database.ref(`recipes/${recipeId}/videos/creator`).set({
                        "created": "YES",
                        "url": `videos/${recipeId}/${videoFile.name}`
                    }, err => {
                        if (err) {
                            errorAlert(err);
                            PROGRESS.log(2, "f");
                        } else PROGRESS.log(2, "c");
                    });
                    database.ref(`users/${auth.getUid()}/videos/submissions`).push({
                        "id": recipeId
                    }, err => {
                        if (err) {
                            errorAlert(err);
                            PROGRESS.log(3, "f");
                        } else PROGRESS.log(3, "c");
                    });
                    storage.ref().child(`videos/${recipeId}/${videoFile.name}`).put(videoFile)
                    .then(snapshot => {
                        console.log(snapshot);
                        PROGRESS.log(4, "c");
                        uploadFiles([...stepFilesInputs, thumbnail], 0);
                    })
                    .catch(err => {
                        if (err) {
                            errorAlert(err);
                            PROGRESS.log(4, "f");
                        }
                    })
                } else {
                    PROGRESS.log(2, "c");
                    PROGRESS.log(3, "c");
                    PROGRESS.log(4, "c");
                    uploadFiles([...stepFilesInputs, thumbnail], 0);
                }

                function uploadFiles(arr, idx) {
                    if (arr[idx]) {
                        storage.ref().child(`images/${recipeId}/${arr[idx].name}`).put(arr[idx])
                        .then(snapshot => {
                            PROGRESS.log(5+idx, "c");
                            if ((idx+1) < arr.length) uploadFiles(arr, idx + 1);
                        })
                        .catch(err =>{
                            errorAlert(err);
                            PROGRESS.log(5+idx, "f");
                        });
                    } else if ((idx + 1) < arr.length) {
                        PROGRESS.log(5+idx, "c");
                        uploadFiles(arr, idx + 1);
                    } else PROGRESS.log(5+idx, "c");
                }

                var placeholder = { "id": "NO_ID" };
                database.ref(`recipes/${recipeId}/reviews/community/raters`).push(placeholder, err => {
                    if (err) {
                        errorAlert(err);
                        PROGRESS.log(6+stepFilesInputs.length, "f");
                    } else PROGRESS.log(6+stepFilesInputs.length, "c");
                });
                database.ref(`recipes/${recipeId}/reviews/photo/raters`).push(placeholder, err => {
                    if (err) {
                        errorAlert(err);
                        PROGRESS.log(7+stepFilesInputs.length, "f");
                    } else PROGRESS.log(7+stepFilesInputs.length, "c");
                });
                database.ref(`recipes/${recipeId}/videos/community/users`).push(placeholder, err => {
                    if (err) {
                        errorAlert(err);
                        PROGRESS.log(8+stepFilesInputs.length, "f");
                    } else PROGRESS.log(8+stepFilesInputs.length, "c");
                });


                // upload ingredients
                for (var i=0; i<(ingredientsInputs.length/2); i++) {
                    (function(idx, offset) {
                        database.ref(`recipes/${recipeId}/ingredients`).push({
                            "name": ingredientsInputs[idx],
                            "quantity": ingredientsInputs[idx + 1]
                        }, err => {
                            if (err) {
                                errorAlert(err);
                                PROGRESS.log((idx/2) + offset, "f");
                            } else PROGRESS.log((idx/2) + offset, "c");
                        });
                    })(i*2, 9+stepFilesInputs.length);
                }
                
                // upload instructions
                for (var j=0; j<stepTextsInputs.length; j++) {
                    (function(idx, offset) {
                        database.ref(`recipes/${recipeId}/instructions`).push({
                            "step": `${idx + 1}`,
                            "text": stepTextsInputs[idx],
                            "url": ((stepFilesInputs[idx]) ? `images/${recipeId}/${stepFilesInputs[idx].name}` : "NO_URL")
                        }, err => {
                            if (err) {
                                errorAlert(err);
                                PROGRESS.log(idx + offset, "f");
                            } else PROGRESS.log(idx + offset, "c");
                        });
                    })(j, 9+stepFilesInputs.length+(ingredientsInputs.length/2));
                }
            }
        });
    };
}

function initSection(id) {
    var box = document.querySelector(`.${id}s-box`);
    box.innerHTML = "";

    function addInput(id) {
        if (document.querySelectorAll(`.${id}s-box div p`).length > 0) box.innerHTML = "";
        var input = (id == "ingredient") ? newIngredientInput() : newStepInput();
        box.appendChild(input);
    }
    document.getElementById(`${id}Btn`).onclick = function() {
        event.preventDefault();
        addInput(id);
    };
    addInput(id);
}

function newInput(label, type, ...add) {
    var l = document.createElement("label");
    l.innerHTML = label;

    var i = document.createElement("input");
    i.setAttribute("type", type);
    if (type !== "text") for (key in add[0]) i.setAttribute(key, add[0][key]);

    var d = document.createElement("div");
    d.appendChild(l);
    d.appendChild(i);

    return d;
}

function newRmvBtn(label = "Parent") {
    var r = document.createElement("button");
    r.innerHTML = `Remove ${label}`;
    r.onclick = function() {
        event.preventDefault();
        var parent = r.parentNode,
            grandparent = parent.parentNode;

        grandparent.removeChild(parent);

        if (grandparent.children.length < 1) {
            var d = document.createElement("div");
            var p = document.createElement("p");
            p.innerHTML = "No item in this section.";

            d.appendChild(p);
            grandparent.appendChild(d);
        }
    };

    return r;
}

function newIngredientInput() {
    var i = document.createElement("div");
    i.appendChild(newInput("Ingredient", "text"));
    i.appendChild(newInput("Quantity", "text"));
    i.appendChild(newRmvBtn("Ingredient"));

    return i;
}

function newStepInput() {
    var i = document.createElement("div");
    i.appendChild(newInput("Step", "text"));
    i.appendChild(newInput("Step Image", "file", {
        accept: "image/png, image/jpeg"
    }));
    i.appendChild(newRmvBtn("Step"));

    return i;
}

// how to get file for storage:
// let storageRef = storage.ref("images/wasiagoodmeme.jpg").getDownloadURL().then(result => {
//     console.log(result);
//     let imgEle = document.createElement("img");
//     document.body.appendChild(imgEle);

//     imgEle.src = result;
//     imgEle.style.width = "400px";
//     imgEle.style.height = "400px";
//     imgEle.style.backgroundColor = "red";
// }).catch(err => alert(err.message));