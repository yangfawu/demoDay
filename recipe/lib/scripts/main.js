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

document.querySelector(".error-content button").onclick = function() {
    document.querySelector(".error-box").style.display = "none";
}

var errorAlert = (msg = "Error Message.") => {
    document.querySelector(".error-box").style.display = "grid";
    document.querySelector(".error-msg").innerHTML = msg;
};

// Logged In Logistics
let USER_LOGGED_IN = false;
auth.onAuthStateChanged(user => {
    if (user) {
        USER_LOGGED_IN = true;
    } else {
        USER_LOGGED_IN = false;
    }
});

(function() {
    document.querySelector(".search-form").style.display = "block";
    document.querySelector(".results-box").style.display = "none";
    document.querySelector(".recipe-summary").style.display = "none";

    var iq = document.querySelector(".ingredient-query");
    iq.innerHTML = "";
    function a() { iq.appendChild(newIngredientBox()); }
    document.getElementById("moreBtn").onclick = function() {
        event.preventDefault();
        a();
    };
    a();

    document.getElementById("submitBtn").onclick = function() {
        event.preventDefault();
        queryRecipe();
    };
})();


// Form
function newIngredientBox() {
    var i = document.createElement("input");
    i.setAttribute("type", "text");

    var b = document.createElement("div");
    b.onclick = function() {
        event.preventDefault();
        var parent = b.parentNode,
            grandparent = parent.parentNode;

        if (grandparent.children.length < 2) return errorAlert("You can't look up a recipe without at least one ingredient.");

        grandparent.removeChild(parent);
    };

    var d = document.createElement("div");
    d.setAttribute("class", "ingredient-query-INGRED-BOX");
    d.appendChild(i);
    d.appendChild(b);

    return d;
}

function queryRecipe() {
    var ingreds = document.querySelectorAll(".ingredient-query div input[type = text]");
    var ingredsInputs = Array.from(ingreds).map(input => input.value.toLowerCase());
    
    if (ingredsInputs.length < 1) return errorAlert("You must search with at least one ingredient.");
    else if (ingredsInputs.filter(input => input.length == 0).length > 0) return errorAlert("Not all the input fields are filled.");

    var iiCopy = ingredsInputs.slice();
    var iiText;
    switch (iiCopy.length) {
        case 1:
            iiText = iiCopy.join();
            break;
        case 2:
            iiText = iiCopy.join(" and/or ");
            break;
        default:
            iiCopy.splice(iiCopy.length-1, 0, "and/or");
            iiText = iiCopy.join(", ");
    }

    document.querySelector(".results-box").style.display = "block";
    document.querySelector(".results-box h3").innerHTML = `Searching our database for recipes that have ${iiText} in their ingredient lists...`; 
    document.querySelector(".results").style.display = "none";
    document.querySelector(".recipe-summary").style.display = "none";


    firebase.database().ref('recipes').once('value')
    .then(snapshot => {
        var recipes = snapshot.val();
        var matchKeys = [];

        // go through every recipe in the database
        for (rKey in recipes) {
            var recipe = recipes[rKey];
            var rIngreds = recipe.ingredients;

            var recipeIngreds = [];
            for (iKey in rIngreds) recipeIngreds.push(rIngreds[iKey].name);
            recipeIngreds = recipeIngreds.map(ingred => ingred.toLowerCase());

            if (recipeIngreds.length < ingredsInputs.length) {
                for (rIngred of recipeIngreds) {
                    if (ingredsInputs.includes(rIngred)) {
                        matchKeys.push(rKey);
                        break;
                    }
                }
            } else {
                for (iIngred of ingredsInputs) {
                    if (recipeIngreds.includes(iIngred)) {
                        matchKeys.push(rKey);
                        break;
                    }
                }
            }
        }

        displayMatches(matchKeys, recipes);
    })
    .catch(err => errorAlert(err));
}

function displayMatches(recipeKeys, recipes) {
    if (recipeKeys.length < 1) 
        return document.querySelector(".results-box h3").innerHTML = `We couldn't find any recipes in our database that had the ingredients you searched with. Our search engine is spelling-sensitive, so please check your spelling before trying again.`;
    else document.querySelector(".results-box h3").innerHTML = "Here are some recipes that we found based on the ingredients you gave us:"

    var r = document.querySelector(".results");
    r.innerHTML = "";

    function newRecipeBox(recipe, RECIPE_ID) {
        let i = document.createElement("img");
        let THUMBNAIL_SRC;
        storage.ref(`${recipe.thumbnail}`).getDownloadURL().then(result => {
            i.src = result;
            THUMBNAIL_SRC = result;
        }).catch(err => errorAlert(err));
        let imgContainer = document.createElement("div");
        imgContainer.setAttribute("class", "results-recipe-box-img");
        imgContainer.appendChild(i);
    
        let h1 = document.createElement("h1");
        h1.innerHTML = recipe.name;
        let infoContainer = document.createElement("div");
        infoContainer.setAttribute("class", "results-recipe-box-info");
        infoContainer.appendChild(h1);
    
        function reviewPara(obj, type) {
            let raters = Object.values(obj.raters);
            let p = document.createElement("p");
            p.innerHTML = `${type} <abbr title='number of raters'>[${raters.length - 1}]</abbr>: ${(function() {
                var AVG;
                if (raters.length < 2) {
                    AVG = "N/A";
                } else if (raters.length >= 2) {
                    for (var i=0, sum=0; i<raters.length; i++) {
                        if (raters[i].id !== "NO_ID") sum+= parseInt(raters[i].rating);
                    }
                    var returnAVG = sum/(raters.length-1);
                    AVG = `${(returnAVG.toString().length > 1) ? returnAVG.toFixed(1) : returnAVG}/5`;
                }

                return AVG;
            })()}`;
    
            return p;
        }
    
        let reviewContainer = document.createElement("div");
        reviewContainer.setAttribute("class", "results-recipe-box-rating");
        reviewContainer.appendChild(reviewPara(recipe.reviews.community, "<abbr title='Community Rating'>CR</abbr>"));
        reviewContainer.appendChild(reviewPara(recipe.reviews.photo, "<abbr title='Photo Rating'>PR</abbr>"));
    
        let rContainer = document.createElement("div");
        rContainer.setAttribute("class", "results-recipe-box");
        rContainer.appendChild(imgContainer);
        rContainer.appendChild(infoContainer);
        rContainer.appendChild(reviewContainer);

        rContainer.onclick = function() {
            var RECIPE_SUMMARY = document.querySelector(".recipe-summary");
            var childsToAppend = [];

            window.location.href = "#submitBtn";


            // when user selects a recipe
            document.querySelector(".results-box").style.display = "none";
            RECIPE_SUMMARY.style.display = "block";
            RECIPE_SUMMARY.innerHTML = "";



            // recipe-summary-thumbnail
            var rst = document.createElement("div");
            rst.setAttribute("class", "recipe-summary-thumbnail");

            var rsti = document.createElement("img");
            rsti.src = THUMBNAIL_SRC;

            rst.appendChild(rsti);

            childsToAppend.push(rst);


            // recipe-summary-head
            var rsh = document.createElement("div");
            rsh.setAttribute("class", "recipe-summary-head");

            var rsht = document.createElement("h1");
            rsht.setAttribute("class", "recipe-summary-head-title");
            rsht.innerHTML = recipe.name;

            var rshd = document.createElement("h2");
            rshd.setAttribute("class", "recipe-summary-head-date");
            rshd.innerHTML = "Uploaded by User";
            firebase.database().ref(`users/${recipe.user}`).once('value')
            .then(snapshot => {
                var info = rshd.innerHTML.split(" ");
                info[info.length - 1] = `${snapshot.val().name.first} ${snapshot.val().name.last}`;

                rshd.innerHTML = info.join(" ");
            })
            .catch(err => errorAlert(err));

            var rshp = document.createElement("p");
            rshp.setAttribute("class", "recipe-summary-head-description");
            rshp.innerHTML = recipe.description;

            rsh.appendChild(rsht);
            rsh.appendChild(rshd); 
            rsh.appendChild(rshp);

            childsToAppend.push(rsh);


            // recipe-summary-ingredients
            var rsi = document.createElement("div");
            rsi.setAttribute("class", "recipe-summary-ingredients");

            var rsih = document.createElement("h1");
            rsih.innerHTML = "Ingredients:";
            rsi.appendChild(rsih);

            var rsiul = document.createElement("ul");
            var ingreds = recipe.ingredients;
            for (key in ingreds) {
                var ingred = ingreds[key];
                var li = document.createElement("li");
                li.innerHTML = `${ingred.name} (${ingred.quantity})`;

                rsiul.appendChild(li);
            }

            rsi.appendChild(rsiul);

            childsToAppend.push(rsi);


            // recipe-summary-instruction
            var rsin = document.createElement("div");
            rsin.setAttribute("class", "recipe-summary-instruction");

            var rsinh = document.createElement("h1");
            rsinh.innerHTML = "Steps:";
            rsin.appendChild(rsinh);

            var steps = [];
            for (key in recipe.instructions) {
                var s = recipe.instructions[key];
                steps[parseInt(s.step) - 1] = {
                    text: s.text,
                    url: s.url
                };
            }

            for (var i=0; i<steps.length; i++) {
                var sc = document.createElement("div");
                sc.setAttribute("class", "recipe-summary-instruction-step-box");

                var sch = document.createElement("h1");
                sch.innerHTML = `Step ${i + 1}`;

                var scp = document.createElement("p");
                scp.innerHTML = steps[i].text;

                sc.appendChild(sch);
                sc.appendChild(scp);

                rsin.appendChild(sc);
            }

            childsToAppend.push(rsin);


            // recipe-summary-review
            var rsr = document.createElement("div");
            rsr.setAttribute("class", "recipe-summary-review");


            // recipe-summary-review-community
            var rsrc = document.createElement("div");
            rsrc.setAttribute("class", "recipe-summary-review-community");

            // recipe-summary-review-community-stats
            var rsrcs = document.createElement("div");
            rsrcs.setAttribute("class", "recipe-summary-review-community-stats");
            
            var rsrh = document.createElement("h1");
            rsrh.innerHTML = "Community Review:";
            rsr.appendChild(rsrh);

            var rsrpR = document.createElement("p");
            rsrpR.innerHTML = `Average Rating: #`;

            var rsrpL = document.createElement("p");
            rsrpL.innerHTML = `There are currently # community raters on this recipe.`;

            var raters = Object.values(recipe.reviews.community.raters);
            if (raters.length < 2) {
                rsrpR.innerHTML = `Average Rating: N/A`;
                rsrpL.innerHTML = `There are currently 0 community raters on this recipe.`;
            } else if (raters.length >= 2) {
                for (var i=0, sum=0; i<raters.length; i++) {
                    if (raters[i].id !== "NO_ID") sum+= parseInt(raters[i].rating);
                }
                var rsrpRAVERAGE = sum/(raters.length-1);
                rsrpR.innerHTML = `Average Rating: ${(rsrpRAVERAGE.toString().length > 1) ? rsrpRAVERAGE.toFixed(1) : rsrpRAVERAGE}/5`;
                rsrpL.innerHTML = `There ${(raters.length-1 == 0 || raters.length-1 > 1) ? "are" : "is"} currently ${raters.length - 1} community rater${(raters.length-1 == 1) ? "" : "s"} on this recipe.`;
            }

            rsrcs.appendChild(rsrh);
            rsrcs.appendChild(rsrpR);
            rsrcs.appendChild(rsrpL);

            rsrc.appendChild(rsrcs);

            // recipe-summary-review-community-personal
            var rsrcp = document.createElement("div");
            rsrcp.setAttribute("class", "recipe-summary-review-community-personal");

            if (USER_LOGGED_IN) {
                database.ref(`recipes/${RECIPE_ID}/reviews/community/raters`).once("value")
                .then(snapshot => {
                    var raters = Object.values(snapshot.val());
                    if (raters.filter(rater => rater.id == auth.getUid()).length < 1) {
                        // no review from the user
                        var rsrcph = document.createElement("p");
                        rsrcph.innerHTML = "Click to Give a Community Rating";
                        rsrcp.appendChild(rsrcph);
        
                        var rsrcpForm = document.createElement("form");
        
                        var ratingBox = document.createElement("div");
                        var ratingBoxH = document.createElement("h1");
                        ratingBoxH.innerHTML = "Rate it out of 5 Stars";
                        ratingBox.appendChild(ratingBoxH);
        
                        var ratingBoxS = document.createElement("select");
                        for (var i=0; i<6; i++) {
                            var ratingBoxO = document.createElement("option");
                            ratingBoxO.setAttribute("value", i);
                            ratingBoxO.innerHTML = `${i} Stars`;
        
                            ratingBoxS.appendChild(ratingBoxO);
                        }
                        ratingBox.appendChild(ratingBoxS);
        
                        rsrcpForm.appendChild(ratingBox);
                        rsrcpForm.style.display = "none";
        
                        var comReSubmitBTN = document.createElement("button");
                        comReSubmitBTN.innerHTML = "Submit Rating";
                        comReSubmitBTN.onclick = function() {
                            event.preventDefault();
                            var COMMUNITY_RATING = ratingBoxS.value;
                            database.ref(`users/${auth.getUid()}/ratings/submissions`).push({
                                id: RECIPE_ID,
                                type: "COMMUNITY"
                            }, err => {
                                if (err) errorAlert(err)
                            });
                            var UPDATE = {
                                id: auth.getUid(),
                                rating: COMMUNITY_RATING
                            };
                            database.ref(`recipes/${RECIPE_ID}/reviews/community/raters`).push(
                                UPDATE, err => { if (err) errorAlert(err) }
                            );

                            raters = [...raters, UPDATE];
                            for (var i=0, sum=0; i<raters.length; i++) {
                                if (raters[i].id !== "NO_ID") sum+= parseInt(raters[i].rating);
                            }
                            
                            var rsrpRAVERAGE = sum/(raters.length-1);
                            rsrpR.innerHTML = `Average Rating: ${(rsrpRAVERAGE.toString().length > 1) ? rsrpRAVERAGE.toFixed(1) : rsrpRAVERAGE}/5`;
                            rsrpL.innerHTML = `There ${(raters.length-1 == 0 || raters.length-1 > 1) ? "are" : "is"} currently ${raters.length - 1} community rater${(raters.length-1 == 1) ? "" : "s"} on this recipe.`;
                            
                            var rsrcpFormCONFIRM = document.createElement("p");
                            rsrcpFormCONFIRM.innerHTML = "Thank you for your review!";
                            rsrcpForm.innerHTML = "";
                            rsrcpForm.appendChild(rsrcpFormCONFIRM);
                        }
                        rsrcpForm.appendChild(comReSubmitBTN);
        
                        rsrcp.style.cursor = "pointer";
                        rsrcp.onclick = function() {
                            rsrcpForm.style.display = "block";
                            rsrcph.style.display = "none";

                            rsrcp.style.cursor = "auto";
                            rsrcp.setAttribute("onclick", "javascript:void(0)");
                        }
        
                        rsrcp.appendChild(rsrcpForm);
                    } else {
                        var ALREADY_RATED_P = document.createElement("p");
                        ALREADY_RATED_P.innerHTML = "You have already given a community review to this recipe."

                        rsrcp.appendChild(ALREADY_RATED_P);
                    } 
                })
                .catch(err => {
                    if (err) {
                        errorAlert(err);
                        var FAIL_RSR_P = document.createElement("p");
                        FAIL_RSR_P.innerHTML = "Failed To Load Review Form. Please try again later."

                        rsrcp.appendChild(FAIL_RSR_P);
                    }
                })
            } else {
                var rsrcpa = document.createElement("p");
                rsrcpa.innerHTML = "Click to go Login to Leave a Review";

                rsrcp.style.cursor = "pointer";
                rsrcp.onclick = function () {
                    rsrcp.style.cursor = "auto";
                    window.location.href = "../index.html";
                }

                rsrcp.appendChild(rsrcpa);
            }

            rsrc.appendChild(rsrcp);

            rsr.appendChild(rsrc); // add community review section

            // recipe-summary-review-photo
            var rsrp = document.createElement("div");
            rsrp.setAttribute("class", "recipe-summary-review-photo");

            // recipe-summary-review-photo-stats
            var rsrps = document.createElement("div");
            rsrps.setAttribute("class", "recipe-summary-review-photo-stats");
            
            var rsrpsh = document.createElement("h1");
            rsrpsh.innerHTML = "Photo Review:";
            rsrps.appendChild(rsrpsh);

            var rsrpsR = document.createElement("p");
            rsrpsR.innerHTML = `Average Rating: #`;

            var rsrpsL = document.createElement("p");
            rsrpsL.innerHTML = `There are currently # photo raters on this recipe.`;

            var RATERS = Object.values(recipe.reviews.photo.raters);
            if (RATERS.length < 2) {
                rsrpsR.innerHTML = `Average Rating: N/A`;
                rsrpsL.innerHTML = `There are currently 0 photo raters on this recipe.`;
            } else if (RATERS.length >= 2) {
                for (var i=0, SUM=0; i<RATERS.length; i++) {
                    if (RATERS[i].id !== "NO_ID") SUM+= parseInt(RATERS[i].rating);
                }
                
                var rsrpRAVERAGE = sum/(raters.length-1);
                rsrpsR.innerHTML = `Average Rating: ${(rsrpRAVERAGE.toString().length > 1) ? rsrpRAVERAGE.toFixed(1) : rsrpRAVERAGE}/5`;
                rsrpsL.innerHTML = `There ${(RATERS.length-1 == 0 || RATERS.length-1 > 1) ? "are" : "is"} currently ${RATERS.length - 1} photo rater${(RATERS.length-1 == 1) ? "" : "s"} on this recipe.`;
            }

            rsrps.appendChild(rsrpsh);
            rsrps.appendChild(rsrpsR);
            rsrps.appendChild(rsrpsL);

            rsrp.appendChild(rsrps);

            // recipe-summary-review-community-personal
            var rsrpp = document.createElement("div");
            rsrpp.setAttribute("class", "recipe-summary-review-community-personal");

            if (USER_LOGGED_IN) {
                database.ref(`recipes/${RECIPE_ID}/reviews/photo/raters`).once("value")
                .then(snapshot => {
                    var raters = Object.values(snapshot.val());
                    if (raters.filter(rater => rater.id == auth.getUid()).length < 1) {
                        // no review from the user
                        var rsrpph = document.createElement("p");
                        rsrpph.innerHTML = "Click to Give a Photo Rating";
                        rsrpp.appendChild(rsrpph);
        
                        var rsrppForm = document.createElement("form");
        
                        var ratingBox = document.createElement("div");
                        var ratingBoxH = document.createElement("h1");
                        ratingBoxH.innerHTML = "Rate it out of 5 Stars";
                        ratingBox.appendChild(ratingBoxH);
        
                        var ratingBoxS = document.createElement("select");
                        for (var i=0; i<6; i++) {
                            var ratingBoxO = document.createElement("option");
                            ratingBoxO.setAttribute("value", i);
                            ratingBoxO.innerHTML = `${i} Stars`;
        
                            ratingBoxS.appendChild(ratingBoxO);
                        }
                        ratingBox.appendChild(ratingBoxS);
        
                        rsrppForm.appendChild(ratingBox);
                        rsrppForm.style.display = "none";

                        var ratingPhoto = document.createElement("div");
                        var ratingPhotoH = document.createElement("h1");
                        ratingPhotoH.innerHTML = "Picture Of the Meal";
                        ratingPhoto.appendChild(ratingPhotoH);

                        var ratingPhotoI = document.createElement("input");
                        ratingPhotoI.setAttribute("type", "file");
                        ratingPhotoI.setAttribute("accept", "image/png, image/jpeg");
                        ratingPhoto.appendChild(ratingPhotoI);
                        rsrppForm.appendChild(ratingPhoto);

                        var ratingReason = document.createElement("div");
                        var ratingReasonH = document.createElement("h1");
                        ratingReasonH.innerHTML = "Reason for Review";
                        ratingReason.appendChild(ratingReasonH);

                        var comReSubmitBTN = document.createElement("button");
                        comReSubmitBTN.innerHTML = "Submit Photo Review";
                        comReSubmitBTN.onclick = function() {
                            event.preventDefault();
                            var PHOTO_RATING = ratingBoxS.value;
                            database.ref(`users/${auth.getUid()}/ratings/submissions`).push({
                                id: RECIPE_ID,
                                type: "PHOTO"
                            }, err => {
                                if (err) errorAlert(err)
                            });

                            var photoFile = ratingPhotoI.files[0];

                            if (!photoFile) return errorAlert("You must attach a photo for a photo review.");

                            var photoUrl = `images/${RECIPE_ID}/${auth.getUid()}/${photoFile.name}`;
                            storage.ref().child(photoUrl).put(photoFile)
                            .then(snapshot => {
                                console.log(snapshot);
                            })
                            .catch(err => { if (err) errorAlert(err); })

                            var UPDATE = {
                                id: auth.getUid(),
                                rating: PHOTO_RATING,
                                url: `images/${RECIPE_ID}/${auth.getUid()}/${photoFile.name}`
                            };
                            database.ref(`recipes/${RECIPE_ID}/reviews/photo/raters`).push(
                                UPDATE, err => { if (err) errorAlert(err) }
                            );

                            RATERS = [...RATERS, UPDATE];
                            for (var i=0, sum=0; i<RATERS.length; i++) {
                                if (RATERS[i].id !== "NO_ID") sum+= parseInt(RATERS[i].rating);
                            }
                            
                            var rsrpRAVERAGE = sum/(RATERS.length-1);
                            rsrpsR.innerHTML = `Average Rating: ${(rsrpRAVERAGE.toString().length > 1) ? rsrpRAVERAGE.toFixed(1) : rsrpRAVERAGE}/5`;
                            rsrpsL.innerHTML = `There ${(RATERS.length-1 == 0 || RATERS.length-1 > 1) ? "are" : "is"} currently ${RATERS.length - 1} photo rater${(RATERS.length-1 == 1) ? "" : "s"} on this recipe.`;

                            var rsrppFormCONFIRM = document.createElement("p");
                            rsrppFormCONFIRM.innerHTML = "Thank you for your review!";
                            rsrppForm.innerHTML = "";
                            rsrppForm.appendChild(rsrppFormCONFIRM);
                        }
                        rsrppForm.appendChild(comReSubmitBTN);
        
                        rsrpp.style.cursor = "pointer";
                        rsrpp.onclick = function() {
                            rsrppForm.style.display = "block";
                            rsrpph.style.display = "none";

                            rsrpp.style.cursor = "auto";
                        }
        
                        rsrpp.appendChild(rsrppForm);
                    } else {
                        var ALREADY_RATED_P = document.createElement("p");
                        ALREADY_RATED_P.innerHTML = "You have already given a photo review to this recipe."

                        rsrpp.appendChild(ALREADY_RATED_P);
                    } 
                })
                .catch(err => {
                    if (err) {
                        errorAlert(err);
                        var FAIL_RSR_P = document.createElement("p");
                        FAIL_RSR_P.innerHTML = "Failed To Load Review Form. Please try again later."

                        rsrpp.appendChild(FAIL_RSR_P);
                    }
                })
            } else {
                var rsrppa = document.createElement("p");
                rsrppa.innerHTML = "Click to go Login to Leave a Review";

                rsrpp.style.cursor = "pointer";
                rsrpp.onclick = function () {
                    rsrpp.style.cursor = "auto";
                    window.location.href = "../index.html";
                }

                rsrpp.appendChild(rsrppa);
            }
            
            rsrp.appendChild(rsrpp);


            // recipe-summary-review-photo-gallery
            var rsrpg = document.createElement("div");
            rsrpg.setAttribute("class", "recipe-summary-review-photo-gallery");

            var PHOTO_RATINGS = Object.values(recipe.reviews.photo.raters);
            if (PHOTO_RATINGS.length < 2) {
                var EMPTY_PHOTO_RESPONSE = document.createElement("p");
                EMPTY_PHOTO_RESPONSE.innerHTML = "This recipe currently doesn't have any photo reviews.";

                rsrpg.appendChild(EMPTY_PHOTO_RESPONSE);
            } else if (PHOTO_RATINGS.length >= 2) {
                for (var i=0; i<PHOTO_RATINGS.length; i++) {
                    var rating = PHOTO_RATINGS[i];
                    if (rating.id !== "NO_ID") {
                        var rsrpgpgb = document.createElement("div");
                        rsrpgpgb.setAttribute("class", "photo-gallery-box");

                        var rsrpgpgbi = document.createElement("img");
                        storage.ref(`${rating.url}`).getDownloadURL().then(result => {
                            rsrpgpgbi.src = result;
                        }).catch(err => errorAlert(err));

                        rsrpgpgb.appendChild(rsrpgpgbi);

                        var rsrpgpgbd = document.createElement("div");
                        rsrpgpgbd.setAttribute("class", "photo-gallery-box-testimony");
                        
                        var rsrpgpgbdR = document.createElement("p");
                        rsrpgpgbdR.innerHTML = `User rated ${rating.rating}/5`;

                        database.ref(`users/${rating.id}/name`).once('value')
                        .then(snapshot => {
                            var first = snapshot.val().first;
                            rsrpgpgbdR.innerHTML = `${first} rated ${rating.rating}/5`;
                        })

                        rsrpgpgbd.appendChild(rsrpgpgbdR);

                        rsrpgpgb.appendChild(rsrpgpgbd);

                        rsrpg.appendChild(rsrpgpgb);
                    }
                }
            }

            rsrp.appendChild(rsrpg);

            rsr.appendChild(rsrp); // add photo review section

            childsToAppend.push(rsr);

            // push all childs
            for (var i=0; i<childsToAppend.length; i++) RECIPE_SUMMARY.appendChild(childsToAppend[i]);
        }
    
        return rContainer;
    }

    for (var i=0; i<recipeKeys.length; i++) r.appendChild(newRecipeBox(recipes[`${recipeKeys[i]}`], recipeKeys[i]));

    document.querySelector(".results").style.display = "grid";
}