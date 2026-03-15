const durationSelect = document.getElementById("duration");
const timerDiv = document.getElementById("timer");
const textDiv = document.getElementById("text");
const input = document.getElementById("input");
const accuracyDiv = document.getElementById("Accuracy");
const wpmDiv = document.getElementById("wpm");

let originalText = textDiv.innerText;
let textArr = originalText.split(" ");

let idx = 0;
let correctType = 0;

let countdown;
let timerStarted = false;
let timeLeft = parseInt(durationSelect.value);
let totalTime = parseInt(durationSelect.value);

timerDiv.innerText = timeLeft;

durationSelect.addEventListener("change", function () {

    clearInterval(countdown);

    timeLeft = parseInt(durationSelect.value);
    totalTime = timeLeft;

    timerDiv.innerText = timeLeft;

    timerStarted = false;
});


input.addEventListener("keydown", function (e) {

    if (!timerStarted) {

        timerStarted = true;

        countdown = setInterval(() => {

            timeLeft--;

            timerDiv.innerText = timeLeft;

            if (timeLeft <= 0) {

                clearInterval(countdown);

                finishGame();
            }

        }, 1000);
    }


    if (e.key === " ") {

        let typedWord = input.value.trim();

        if (typedWord.length === 0) return;

        if (textArr[idx] === typedWord) {

            textArr[idx] = `<span style="color:lime;">${textArr[idx]}</span>`;
            correctType++;

        } else {

            textArr[idx] = `<span style="color:red;">${textArr[idx]}</span>`;
        }

        textDiv.innerHTML = textArr.join(" ");

        idx++;

        updateAccuracy();

        input.value = "";
    }

});


function updateAccuracy() {

    if (idx === 0) return;

    let accuracy = (correctType / idx) * 100;

    accuracyDiv.innerText = accuracy.toFixed(2) + "%";
}



function finishGame() {

    input.disabled = true;

    let minutes = totalTime / 60;

    let wpm = Math.round(correctType / minutes);

    wpmDiv.innerText = wpm;
}


document.querySelector("form").addEventListener("submit", function (e) {

    e.preventDefault();

    location.reload();
});
