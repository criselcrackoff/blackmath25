/* =========================================================
   MATHEMATICAL 25
   main.js
========================================================= */


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const MAX_CARDS = 8;
const LIMIT = 25;

const DEALER_DELAY = 700;

const DIFFICULTIES = {

    easy: {
        label: "Fácil",
        standValue: 21,
        minCards: 6,
        errorChance: 0.70
    },

    normal: {
        label: "Normal",
        standValue: 22,
        minCards: 3,
        errorChance: 0.20
    },

    hard: {
        label: "Difícil",
        standValue: 24,
        minCards: 2,
        errorChance: 0.05
    }

};


/* ==========================================
   EFECTOS DE SONIDO
========================================== */

const audioBase = new URL(
    "../audio/",
    document.currentScript ? document.currentScript.src : window.location.href
);

const gameSounds = {
    start: new Audio(new URL("startgame.mp3", audioBase).href),
    card1: new Audio(new URL("card1.mp3", audioBase).href),
    card2: new Audio(new URL("card2.mp3", audioBase).href)
};

Object.values(gameSounds).forEach(sound => {
    sound.preload = "auto";
    sound.volume = 0.65;
});

function playSound(name) {
    const original = gameSounds[name];
    if (!original) return;

    // Reinicia el efecto para que suene completo cada vez que se activa.
    original.pause();
    original.currentTime = 0;
    original.play().catch(() => {
        // El navegador puede bloquear el audio si no hubo interacción del usuario.
    });
}

function playRandomCardSound() {
    playSound(Math.random() < 0.5 ? "card1" : "card2");
}


/* =========================================================
   ELEMENTOS
========================================================= */

const gameStatus = {textContent: ""};

const rulesButton = document.getElementById("rules-button");
const rulesModal = document.getElementById("rules-modal");
const closeRules = document.getElementById("close-rules");

const newGameModal = document.getElementById("new-game-modal");
const restartButton = document.getElementById("restart-button");
const cancelNewGame = document.getElementById("cancel-new-game");
const confirmNewGame = document.getElementById("confirm-new-game");

const resultModal = document.getElementById("result-modal");
const resultTitle = document.getElementById("result-title");
const resultSubtitle = document.getElementById("result-subtitle");

const resultDealerScore =
    document.getElementById("result-dealer-score");

const resultDealerCards =
    document.getElementById("result-dealer-cards");

const resultDealerValid =
    document.getElementById("result-dealer-valid");

const resultPlayerScore =
    document.getElementById("result-player-score");

const resultPlayerCards =
    document.getElementById("result-player-cards");

const resultPlayerValid =
    document.getElementById("result-player-valid");

const resultTaunt =
    document.getElementById("result-taunt");

const resultNewGame =
    document.getElementById("result-new-game");


const difficultyContainer =
    document.getElementById("difficulty-container");

const difficultyButton =
    document.getElementById("difficulty-button");

const difficultyFlyout =
    document.getElementById("difficulty-flyout");

const currentDifficulty =
    document.getElementById("current-difficulty");

const difficultyInfo =
    document.getElementById("difficulty-info");

const difficultyOptions =
    document.querySelectorAll(".difficulty-option");


const dealerMessage =
    document.getElementById("dealer-message");

const dealerNumerator =
    document.getElementById("dealer-numerator");

const dealerDenominator =
    document.getElementById("dealer-denominator");

const dealerCardCount =
    document.getElementById("dealer-card-count");

const dealerScore =
    document.getElementById("dealer-score");


const playerMessage =
    document.getElementById("player-message");

const numerator =
    document.getElementById("numerator");

const denominator =
    document.getElementById("denominator");

const pendingArea =
    document.getElementById("pending-area");

const pendingCardElement =
    document.getElementById("pending-card");

const cardCountElement =
    document.getElementById("card-count");

const playerScoreElement =
    document.getElementById("player-score");

const drawButton =
    document.getElementById("draw-button");

const standButton =
    document.getElementById("stand-button");


const drawOverlay =
    document.getElementById("draw-overlay");

const drawTray =
    document.getElementById("draw-tray");

const drawTrayTitle =
    document.getElementById("draw-tray-title");

const drawTrayCard =
    document.getElementById("draw-tray-card");

const drawTrayHint =
    document.getElementById("draw-tray-hint");

const discardCardButton =
    document.getElementById("discard-card-button");


/* =========================================================
   ESTADO
========================================================= */

let difficulty = "normal";

let roundStarted = false;
let gameOver = false;
let dealerPlaying = false;
let gameGeneration = 0;

let deck = [];

let playerCards = [];
let dealerCards = [];

let numeratorCards = [];
let denominatorCards = [];

let dealerNumeratorCards = [];
let dealerDenominatorCards = [];

let pendingCards = [];


/*
 * Carta actualmente mostrada en el panel inferior.
 *
 * new     = carta recién obtenida.
 * pending = carta que fue reemplazada.
 */
let trayCard = null;
let trayMode = null;


/*
 * Sistema de arrastre.
 */
let dragState = null;
let draggedCardId = null;


/* =========================================================
   CARTAS
========================================================= */

const RANKS = [

    { name: "A", value: 14 },
    { name: "2", value: 2 },
    { name: "3", value: 3 },
    { name: "4", value: 4 },
    { name: "5", value: 5 },
    { name: "6", value: 6 },
    { name: "7", value: 7 },
    { name: "8", value: 8 },
    { name: "9", value: 9 },
    { name: "10", value: 10 },
    { name: "J", value: 11 },
    { name: "Q", value: 12 },
    { name: "K", value: 13 }

];


function createDeck() {

    const result = [];

    let id = 1;


    /*
     * Corazones y espadas.
     */
    for (const suit of [

        {
            symbol: "♥",
            color: "red"
        },

        {
            symbol: "♠",
            color: "black"
        }

    ]) {

        for (const rank of RANKS) {

            result.push({

                id,

                name: rank.name,

                value: rank.value,

                symbol: suit.symbol,

                color: suit.color,

                isJoker: false,

                lockedRole: null

            });

            id++;

        }

    }


    /*
     * DOS JOKERS.
     */
    result.push({

        id,

        name: "JOKER",

        value: 1,

        symbol: "🃏",

        color: "joker",

        isJoker: true,

        lockedRole: null

    });

    id++;


    result.push({

        id,

        name: "JOKER",

        value: 1,

        symbol: "🃏",

        color: "joker",

        isJoker: true,

        lockedRole: null

    });


    return result;

}


function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }

    return array;

}

function drawCard(allowJoker = true) {

    if (deck.length === 0) {
        return null;
    }

    let index;

    if (allowJoker) {

        index =
            deck.length - 1;

    } else {

        const validIndexes = [];

        for (
            let i = 0;
            i < deck.length;
            i++
        ) {

            if (!deck[i].isJoker) {
                validIndexes.push(i);
            }

        }

        if (validIndexes.length === 0) {
            return null;
        }

        index =
            validIndexes[
                Math.floor(
                    Math.random() *
                    validIndexes.length
                )
            ];

    }

    const card =
        deck.splice(index, 1)[0];

    card.lockedRole = null;

    updateJokerAvailability();

    return card;
}


/* =========================================================
   JOKER
========================================================= */

/*
 * Un Joker vale 1.
 *
 * Si la mano contiene DOS Jokers,
 * ambos pasan a valer 14.
 */
function getEffectiveCardValue(
    card,
    hand
) {

    if (!card) {
        return 0;
    }

    if (!card.isJoker) {
        return card.value;
    }

    const jokerCount =
        hand.filter(
            item => item.isJoker
        ).length;


    if (jokerCount >= 2) {
        return 14;
    }

    return 1;

}

const jokerAvailableCount =
    document.getElementById(
        "joker-available-count"
    );


function updateJokerAvailability() {

    if (!jokerAvailableCount) {
        return;
    }

    const available =
        deck.filter(
            card =>
                card.isJoker
        ).length;

    jokerAvailableCount.textContent =
        `${available}/2`;
}

/*
 * Cuenta cuántos Jokers tiene una mano.
 */
function getJokerCount(hand) {

    return hand.filter(
        card => card.isJoker
    ).length;

}


/* =========================================================
   UTILIDADES
========================================================= */

function getCurrentHighest() {

    return getHighestCards(
        playerCards
    ).highest;

}


function getCurrentSecondHighest() {

    return getHighestCards(
        playerCards
    ).second;

}


function getHighestCards(cards) {

    /*
     * LOS JOKERS SE EXCLUYEN COMPLETAMENTE
     * DE ESTA selección.
     *
     * Aunque valgan 14, nunca pueden convertirse
     * en carta más alta o segunda más alta.
     */
    const eligibleCards =
        cards.filter(
            card =>
                !card.isJoker
        );


    const sorted =
        [...eligibleCards]
            .sort(
                (a, b) =>
                    b.value -
                    a.value
            );


    return {

        highest:
            sorted[0] ||
            null,

        second:
            sorted[1] ||
            null

    };

}


function getCardById(id) {

    return playerCards.find(
        card =>
            card.id === id
    ) || null;

}


/* =========================================================
   PUNTUACIÓN
========================================================= */

function calculateScore() {

    // Solo cuentan las cartas efectivamente colocadas.
    // Una carta en el panel inferior no forma parte de la fórmula.
    const placedCards = [
        ...numeratorCards,
        ...denominatorCards
    ];

    if (placedCards.length === 0) {
        return 0;
    }

    // Un segundo Joker activa el valor 14 solamente tras colocarse.
    const numeratorProduct = numeratorCards.reduce(
        (total, card) => total * getEffectiveCardValue(card, placedCards),
        1
    );

    const denominatorProduct = denominatorCards.reduce(
        (total, card) => total * getEffectiveCardValue(card, placedCards),
        1
    );

    if (denominatorProduct === 0) {
        return 0;
    }

    return (numeratorProduct / denominatorProduct) * placedCards.length * 2;
}

// Evita que puntuaciones pequeñas pero positivas parezcan cero.
function formatScore(score) {
    if (!Number.isFinite(score)) return "0.00";
    if (score !== 0 && Math.abs(score) < 0.01) {
        return score.toFixed(4);
    }
    return score.toFixed(2);
}

function calculateDealerScore() {

    if (
        dealerCards.length === 0
    ) {

        return 0;

    }


    const numeratorProduct =
        dealerNumeratorCards.reduce(

            (total, card) =>

                total *
                getEffectiveCardValue(
                    card,
                    dealerCards
                ),

            1

        );


    const denominatorProduct =
        dealerDenominatorCards.reduce(

            (total, card) =>

                total *
                getEffectiveCardValue(
                    card,
                    dealerCards
                ),

            1

        );


    if (
        denominatorProduct === 0
    ) {

        return 0;

    }


    return (

        numeratorProduct /
        denominatorProduct

    ) *
    dealerCards.length *
    2;

}


function isValidScore(score) {

    return (
        Number.isFinite(score) &&
        score <= LIMIT
    );

}


/* =========================================================
   INICIALIZACIÓN DE BLOQUEOS
========================================================= */

function initializePlayerLocks() {

    numeratorCards = [];
    denominatorCards = [];


    for (
        const card of playerCards
    ) {

        card.lockedRole = null;

    }


    const {
        highest,
        second
    } =
        getHighestCards(
            playerCards
        );


    /*
     * Solo cartas normales pueden bloquearse.
     */
    if (highest) {

        highest.lockedRole =
            "highest";

        denominatorCards.push(
            highest
        );

    }


    if (second) {

        second.lockedRole =
            "second";

        numeratorCards.push(
            second
        );

    }


    /*
     * Todo lo demás empieza en Numerador.
     *
     * Esto incluye los Jokers.
     */
    for (
        const card of playerCards
    ) {

        if (
            card.id !==
            highest?.id &&
            card.id !==
            second?.id
        ) {

            numeratorCards.push(
                card
            );

        }

    }

}


/* =========================================================
   ELIMINAR CARTA DE FILAS
========================================================= */

function removeCardFromPlayerRows(
    card
) {

    numeratorCards =
        numeratorCards.filter(
            item =>
                item.id !==
                card.id
        );


    denominatorCards =
        denominatorCards.filter(
            item =>
                item.id !==
                card.id
        );

}


/* =========================================================
   TEXTO DE CARTA
========================================================= */

function getCardDisplayText(
    card
) {

    if (card.isJoker) {
        return "JOKER";
    }

    return `${card.name}${card.symbol}`;

}


/* =========================================================
   CREAR CARTA VISUAL
========================================================= */

function createCardElement(
    card,
    options = {}
) {

    const element =
        document.createElement("div");


    element.classList.add(
        "card"
    );


    element.dataset.cardId =
        card.id;


    /*
     * ======================================
     * JOKER
     * ======================================
     */

    if (card.isJoker) {

        element.classList.add(
            "joker"
        );


        const topText =
            document.createElement("span");

        topText.classList.add(
            "joker-corner",
            "joker-corner-top"
        );

        topText.textContent =
            "JOKER";


        const bottomText =
            document.createElement("span");

        bottomText.classList.add(
            "joker-corner",
            "joker-corner-bottom"
        );

        bottomText.textContent =
            "JOKER";


        const centerText =
            document.createElement("span");

        centerText.classList.add(
            "joker-center"
        );

        centerText.textContent =
            "J";


        element.appendChild(
            topText
        );

        element.appendChild(
            centerText
        );

        element.appendChild(
            bottomText
        );


    } else {

        /*
         * ==================================
         * CARTAS NORMALES
         * ==================================
         */

        element.textContent =
            `${card.name}${card.symbol}`;


        if (
            card.color ===
            "red"
        ) {

            element.classList.add(
                "red"
            );

        }

    }


    if (
        card.lockedRole
    ) {

        element.classList.add(
            "locked"
        );

    } else {

        element.classList.add(
            "draggable"
        );

        element.draggable =
            false;

        element.style.touchAction =
            "none";


        if (
            options.source ===
            "board"
        ) {

            element.addEventListener(
                "pointerdown",
                handleBoardPointerDown
            );

        }

    }


    if (
        options.hidden
    ) {

        element.classList.add(
            "hidden-card"
        );

        element.innerHTML =
            "";

        element.textContent =
            "★";

    }


    return element;

}


/* =========================================================
   CARTA FLOTANTE
========================================================= */

function createFloatingCard(
    card
) {

    const floating =
        document.createElement(
            "div"
        );


    floating.classList.add(
        "draw-floating-card"
    );


    if (
        card.color ===
        "red"
    ) {

        floating.classList.add(
            "red"
        );

    }


    if (
        card.isJoker
    ) {

        floating.classList.add(
            "joker"
        );

    }


    floating.textContent =
        getCardDisplayText(
            card
        );


    document.body.appendChild(
        floating
    );


    return floating;

}


function positionFloatingCard(
    floating,
    x,
    y
) {

    if (!floating) {
        return;
    }


    const rect =
        floating.getBoundingClientRect();


    floating.style.left =
        `${x - rect.width / 2}px`;


    floating.style.top =
        `${y - rect.height / 2}px`;

}


/* =========================================================
   ARRASTRE DE CARTAS
========================================================= */

function handleBoardPointerDown(
    event
) {

    if (
        gameOver ||
        dealerPlaying
    ) {

        return;

    }


    /*
     * Si hay una carta en el slide,
     * el tablero no puede iniciar arrastre.
     */
    if (trayCard) {
        return;
    }


    const element =
        event.currentTarget;


    const cardId =
        Number(
            element.dataset.cardId
        );


    const card =
        getCardById(
            cardId
        );


    if (!card) {
        return;
    }


    /*
     * Los bloqueados no se pueden mover.
     */
    if (
        card.lockedRole
    ) {

        return;

    }


    event.preventDefault();


    clearDropHighlights();


    draggedCardId =
        card.id;


    const floating =
        createFloatingCard(
            card
        );


    positionFloatingCard(
        floating,
        event.clientX,
        event.clientY
    );


    element.style.opacity =
        "0.25";


    playRandomCardSound();

    dragState = {

        source: "board",

        card,

        originalElement:
            element,

        floating,

        pointerId:
            event.pointerId,

        targetZone:
            null

    };

}


function handleTrayPointerDown(
    event
) {

    if (
        gameOver ||
        dealerPlaying
    ) {

        return;

    }


    if (!trayCard) {
        return;
    }


    event.preventDefault();


    const element =
        event.currentTarget;


    const card =
        trayCard;


    clearDropHighlights();


    const floating =
        createFloatingCard(
            card
        );


    positionFloatingCard(
        floating,
        event.clientX,
        event.clientY
    );


    element.style.opacity =
        "0.15";


    drawOverlay.classList.add(
        "dragging"
    );


    playRandomCardSound();

    dragState = {

        source: "tray",

        card,

        originalElement:
            element,

        floating,

        pointerId:
            event.pointerId,

        targetZone:
            null

    };

}


/* =========================================================
   POINTER MOVE
========================================================= */

document.addEventListener(
    "pointermove",
    event => {

        if (!dragState) {
            return;
        }


        if (
            dragState.pointerId !==
            event.pointerId
        ) {

            return;

        }


        event.preventDefault();


        positionFloatingCard(

            dragState.floating,

            event.clientX,

            event.clientY

        );


        updateDragTarget(

            event.clientX,

            event.clientY

        );

    },

    {
        passive: false
    }

);


/* =========================================================
   DROP ZONE
========================================================= */

function getDropZoneAtPoint(
    x,
    y
) {

    const element =
        document.elementFromPoint(
            x,
            y
        );


    if (!element) {
        return null;
    }


    return element.closest(
        ".drop-zone"
    );

}


function updateDragTarget(
    x,
    y
) {

    clearDropHighlights();


    const zone =
        getDropZoneAtPoint(
            x,
            y
        );


    if (!zone) {

        dragState.targetZone =
            null;

        return;

    }


    dragState.targetZone =
        zone.dataset.row;


    zone.classList.add(
        "drag-over"
    );

}


function clearDropHighlights() {

    document
        .querySelectorAll(
            ".drop-zone.drag-over"
        )
        .forEach(
            zone => {

                zone.classList.remove(
                    "drag-over"
                );

            }
        );

}


/* =========================================================
   POINTER UP
========================================================= */

document.addEventListener(
    "pointerup",
    event => {

        if (!dragState) {
            return;
        }


        if (
            dragState.pointerId !==
            event.pointerId
        ) {

            return;

        }


        event.preventDefault();


        const state =
            dragState;


        const targetRow =
            state.targetZone;


        cleanupDrag();


        if (!targetRow) {

            render();

            return;

        }


        /*
         * Carta ya colocada.
         */
        if (
            state.source ===
            "board"
        ) {

            movePlacedCard(
                state.card,
                targetRow
            );

            return;

        }


        /*
         * Carta del slide.
         */
        if (
            state.source ===
            "tray"
        ) {

            if (
                trayMode ===
                "new"
            ) {

                placeNewCard(
                    targetRow
                );

                return;

            }


            if (
                trayMode ===
                "pending"
            ) {

                placePendingCard(
                    targetRow
                );

                return;

            }

        }

    },

    {
        passive: false
    }

);


/* =========================================================
   CANCELAR ARRASTRE
========================================================= */

document.addEventListener(
    "pointercancel",
    () => {

        if (!dragState) {
            return;
        }


        cleanupDrag();

        render();

    }
);


function cleanupDrag() {

    if (
        dragState?.originalElement
    ) {

        dragState
            .originalElement
            .style.opacity =
            "";

    }


    if (
        dragState?.floating
    ) {

        dragState
            .floating
            .remove();

    }


    clearDropHighlights();


    if (
        dragState?.source ===
        "tray"
    ) {

        drawOverlay.classList.remove(
            "dragging"
        );

    }


    draggedCardId =
        null;

    dragState =
        null;

}


/* =========================================================
   MOVER CARTA YA COLOCADA
========================================================= */

function movePlacedCard(
    card,
    targetRow
) {

    if (!card) {
        return;
    }


    if (
        card.lockedRole
    ) {

        render();

        return;

    }


    removeCardFromPlayerRows(
        card
    );


    if (
        targetRow ===
        "numerator"
    ) {

        numeratorCards.push(
            card
        );

    } else {

        denominatorCards.push(
            card
        );

    }


    playerMessage.textContent =
        `Has movido ${getCardDisplayText(card)}.`;

    gameStatus.textContent =
        "Partida en progreso";


    render();

}


/* =========================================================
   COLOCAR CARTA NUEVA
========================================================= */

function placeNewCard(
    targetRow
) {

    if (!trayCard) {
        return;
    }


    if (
        trayMode !==
        "new"
    ) {

        return;

    }


    const card =
        trayCard;


    removeCardFromPlayerRows(
        card
    );


    card.lockedRole =
        null;


    if (
        targetRow ===
        "numerator"
    ) {

        numeratorCards.push(
            card
        );

    } else {

        denominatorCards.push(
            card
        );

    }


    trayCard =
        null;

    trayMode =
        null;


    closeDrawOverlay();


    playerMessage.textContent =
        `Has colocado ${getCardDisplayText(card)}.`;

    gameStatus.textContent =
        "Partida en progreso";


    render();

}


/* =========================================================
   COLOCAR CARTA REEMPLAZADA
========================================================= */

function placePendingCard(
    targetRow
) {

    if (!trayCard) {
        return;
    }


    if (
        trayMode !==
        "pending"
    ) {

        return;

    }


    const card =
        trayCard;


    pendingCards =
        pendingCards.filter(
            item =>
                item.id !==
                card.id
        );


    card.lockedRole =
        null;


    removeCardFromPlayerRows(
        card
    );


    if (
        targetRow ===
        "numerator"
    ) {

        numeratorCards.push(
            card
        );

    } else {

        denominatorCards.push(
            card
        );

    }


    trayCard =
        null;

    trayMode =
        null;


    closeDrawOverlay();


    playerMessage.textContent =
        `Has colocado la carta reemplazada ${getCardDisplayText(card)}.`;

    gameStatus.textContent =
        "Partida en progreso";


    render();

}


/* =========================================================
   DESCARTAR JOKER
========================================================= */

function discardTrayJoker() {

    if (!trayCard) {
        return;
    }


    if (
        trayMode !==
        "new"
    ) {

        return;

    }


    if (
        !trayCard.isJoker
    ) {

        return;

    }


    const discarded =
        trayCard;

    // Descartar significa retirarlo de la mano y del cálculo de cartas.
    playerCards = playerCards.filter(card => card.id !== discarded.id);
    pendingCards = pendingCards.filter(card => card.id !== discarded.id);
    removeCardFromPlayerRows(discarded);


    /*
     * El Joker queda fuera de la partida.
     *
     * NO vuelve al deck.
     */
    trayCard =
        null;

    trayMode =
        null;


    closeDrawOverlay();


    gameStatus.textContent =
        "Partida en progreso";


    playerMessage.textContent =
        "Has descartado el Joker.";


    render();

}


/* =========================================================
   SLIDE
========================================================= */

function updateDiscardButton() {

    if (!discardCardButton) {
        return;
    }


    const shouldShow =
        !!trayCard &&
        trayMode === "new" &&
        trayCard.isJoker;


    discardCardButton.classList.toggle(
        "hidden",
        !shouldShow
    );


    discardCardButton.disabled =
        !shouldShow;

}


function openDrawOverlay() {

    /*
     * Sin carta no existe slide.
     */
    if (!trayCard) {

        closeDrawOverlay();

        return;

    }


    drawTrayCard.innerHTML =
        "";


    const cardElement =
        createCardElement(
            trayCard,
            {
                source:
                    "tray"
            }
        );


    cardElement.draggable =
        false;


    cardElement.style.touchAction =
        "none";


    cardElement.addEventListener(
        "pointerdown",
        handleTrayPointerDown
    );


    drawTrayCard.appendChild(
        cardElement
    );


    if (
        trayMode ===
        "new"
    ) {

        drawTrayTitle.textContent =
            "CARTA OBTENIDA";


        if (
            trayCard.isJoker
        ) {

            drawTrayHint.textContent =
                "Colócalo en una fila o descártalo.";

        } else {

            drawTrayHint.textContent =
                "Toma la carta y arrástrala a una fila.";

        }

    } else {

        drawTrayTitle.textContent =
            "CARTA REEMPLAZADA";


        drawTrayHint.textContent =
            "Debes colocar manualmente esta carta en una fila.";

    }


    updateDiscardButton();


    drawOverlay.classList.add(
        "open"
    );

}


function closeDrawOverlay() {

    drawOverlay.classList.remove(
        "open"
    );


    drawOverlay.classList.remove(
        "dragging"
    );


    drawTray.classList.remove(
        "success"
    );


    drawTrayCard.innerHTML =
        "";


    clearDropHighlights();


    updateDiscardButton();

}


/* =========================================================
   DESCARTAR BOTÓN
========================================================= */

discardCardButton.addEventListener(
    "click",
    event => {

        event.preventDefault();

        event.stopPropagation();


        if (
            dragState
        ) {

            return;

        }


        discardTrayJoker();

    }
);


/* =========================================================
   PEDIR CARTA
========================================================= */

drawButton.addEventListener(
    "click",
    () => {

        if (
            gameOver ||
            dealerPlaying
        ) {

            return;

        }


        if (
            pendingCards.length >
            0
        ) {

            return;

        }


        if (
            playerCards.length >=
            MAX_CARDS
        ) {

            return;

        }


        if (trayCard) {
            return;
        }


        if (!roundStarted) {

            roundStarted =
                true;


            setDifficultyLocked(
                true
            );


            gameStatus.textContent =
                "Partida en progreso";

        }


        const newCard =
            drawCard();


        if (!newCard) {
            return;
        }

        // El efecto de carta suena al recogerla, no al pulsar el botón de robar.

        // Capturamos los bloqueos ANTES de añadir la carta.
        const previouslyLocked = playerCards.filter(card => card.lockedRole);

        playerCards.push(newCard);
        newCard.lockedRole = null;

        // Los Jokers no participan en la clasificación de cartas altas.
        const { highest, second } = getHighestCards(playerCards);
        const expectedLocks = new Map();
        if (highest) expectedLocks.set(highest.id, "highest");
        if (second) expectedLocks.set(second.id, "second");

        // Actualizar simultáneamente ambos bloqueos evita que el anterior
        // MÁS ALTA permanezca bloqueado en el denominador por error.
        for (const card of playerCards) {
            card.lockedRole = expectedLocks.get(card.id) || null;
        }

        // Detectar la carta bloqueada que dejó de pertenecer a las dos más altas.
        // Se muestra en el panel para que el jugador elija su nueva fila.
        const displaced = previouslyLocked.filter(
            card => !expectedLocks.has(card.id)
        );

        // Las cartas que ahora forman parte del par superior se retiran
        // de su fila anterior ANTES de insertarlas en su destino definitivo.
        if (highest) removeCardFromPlayerRows(highest);
        if (second) removeCardFromPlayerRows(second);
        if (highest) denominatorCards.unshift(highest);
        if (second) numeratorCards.unshift(second);

        if (displaced.length > 0) {
            const released = displaced[0];
            removeCardFromPlayerRows(released);
            pendingCards = [released];
            trayCard = released;
            trayMode = "pending";
            gameStatus.textContent = "Coloca la carta reemplazada";
            playerMessage.textContent =
                `🔒 ${getCardDisplayText(released)} dejó de estar entre las dos cartas más altas. Reubícala.`;
        } else if (expectedLocks.has(newCard.id)) {
            // La nueva carta adquirió un bloqueo sin desplazar ninguna carta
            // (caso extraordinario de manos con menos de dos cartas normales).
            trayCard = null;
            trayMode = null;
            gameStatus.textContent = "Partida en progreso";
            playerMessage.textContent = `🔒 ${getCardDisplayText(newCard)} quedó bloqueada correctamente.`;
        } else {
            // Carta corriente (incluidos Jokers): debe colocarse desde el slide.
            trayCard = newCard;
            trayMode = "new";
            gameStatus.textContent = "Toma la carta";
            playerMessage.textContent = newCard.isJoker
                ? getJokerCount(playerCards) >= 2
                    ? "Has obtenido ambos Jokers. Cada uno vale 14. Puedes colocar o descartar el nuevo."
                    : "Has obtenido un Joker. Vale 1. Puedes colocarlo o descartarlo."
                : "Toma la carta del panel inferior y colócala en una fila.";
        }

        render();
        if (trayCard) openDrawOverlay();

    }
);


/* =========================================================
   PLANTARSE
========================================================= */

standButton.addEventListener(
    "click",
    () => {

        if (
            gameOver ||
            dealerPlaying
        ) {

            return;

        }


        if (trayCard) {
            return;
        }


        if (
            pendingCards.length >
            0
        ) {

            return;

        }


        const score =
            calculateScore();


        if (
            score > LIMIT
        ) {

            playerMessage.textContent =
                "No puedes plantarte superando 25.";


            gameStatus.textContent =
                "Puntuación inválida";


            return;

        }


        roundStarted =
            true;


        setDifficultyLocked(
            true
        );


        dealerPlaying =
            true;


        drawButton.disabled =
            true;


        standButton.disabled =
            true;


        closeDifficultyFlyout();


        gameStatus.textContent =
            "El Dealer está jugando...";


        playerMessage.textContent =
            "Te has plantado. El Dealer está pensando...";


        playDealer();

    }
);


/* =========================================================
   DEALER
========================================================= */

function initializeDealerLocks() {

    dealerNumeratorCards = [];
    dealerDenominatorCards = [];


    for (
        const card of dealerCards
    ) {

        card.lockedRole =
            null;

    }


    const {
        highest,
        second
    } =
        getHighestCards(
            dealerCards
        );


    if (highest) {

        highest.lockedRole =
            "highest";


        dealerDenominatorCards.push(
            highest
        );

    }


    if (second) {

        second.lockedRole =
            "second";


        dealerNumeratorCards.push(
            second
        );

    }


    for (
        const card of dealerCards
    ) {

        if (
            card.id !==
            highest?.id &&
            card.id !==
            second?.id
        ) {

            dealerNumeratorCards.push(
                card
            );

        }

    }

}


/* =========================================================
   EVALUAR ARREGLOS DEL DEALER
========================================================= */

function evaluateArrangement(
    cards
) {

    if (
        cards.length ===
        0
    ) {

        return null;

    }


    const {
        highest,
        second
    } =
        getHighestCards(
            cards
        );


    /*
     * Solo las cartas no bloqueadas
     * pueden repartirse entre filas.
     */
    const lockedIds =
        new Set();


    if (highest) {
        lockedIds.add(
            highest.id
        );
    }


    if (second) {
        lockedIds.add(
            second.id
        );
    }


    const unlocked =
        cards.filter(
            card =>
                !lockedIds.has(
                    card.id
                )
        );


    let best =
        null;


    const total =
        2 ** unlocked.length;


    for (
        let mask = 0;
        mask < total;
        mask++
    ) {

        const numerator =
            [];

        const denominator =
            [];


        if (second) {

            numerator.push(
                second
            );

        }


        if (highest) {

            denominator.push(
                highest
            );

        }


        for (
            let i = 0;
            i < unlocked.length;
            i++
        ) {

            const card =
                unlocked[i];


            if (
                mask &
                (1 << i)
            ) {

                denominator.push(
                    card
                );

            } else {

                numerator.push(
                    card
                );

            }

        }


        const np =
            numerator.reduce(

                (
                    total,
                    card
                ) =>

                    total *
                    getEffectiveCardValue(
                        card,
                        cards
                    ),

                1

            );


        const dp =
            denominator.reduce(

                (
                    total,
                    card
                ) =>

                    total *
                    getEffectiveCardValue(
                        card,
                        cards
                    ),

                1

            );


        const score =
            (
                np / dp
            ) *
            cards.length *
            2;


        const candidate = {

            numerator,

            denominator,

            score

        };


        if (!best) {

            best =
                candidate;

            continue;

        }


        const candidateValid =
            score <= LIMIT;


        const bestValid =
            best.score <= LIMIT;


        if (
            candidateValid &&
            !bestValid
        ) {

            best =
                candidate;

            continue;

        }


        if (
            candidateValid &&
            bestValid
        ) {

            const candidateDistance =
                Math.abs(
                    LIMIT -
                    score
                );


            const bestDistance =
                Math.abs(
                    LIMIT -
                    best.score
                );


            if (
                candidateDistance <
                bestDistance
            ) {

                best =
                    candidate;

            }

            continue;

        }


        if (
            !candidateValid &&
            !bestValid &&
            score < best.score
        ) {

            best =
                candidate;

        }

    }


    return best;

}


/* =========================================================
   APLICAR ARREGLO DEALER
========================================================= */

function applyDealerArrangement(
    arrangement
) {

    if (!arrangement) {
        return;
    }


    dealerNumeratorCards =
        arrangement.numerator;


    dealerDenominatorCards =
        arrangement.denominator;


    const {
        highest,
        second
    } =
        getHighestCards(
            dealerCards
        );


    for (
        const card of dealerCards
    ) {

        card.lockedRole =
            null;


        if (
            highest?.id ===
            card.id
        ) {

            card.lockedRole =
                "highest";

        }


        if (
            second?.id ===
            card.id
        ) {

            card.lockedRole =
                "second";

        }

    }

}


/* =========================================================
   ARREGLO ALEATORIO DEALER
========================================================= */

function randomDealerArrangement() {

    if (
        dealerCards.length ===
        0
    ) {

        return;

    }


    const {
        highest,
        second
    } =
        getHighestCards(
            dealerCards
        );


    const lockedIds =
        new Set();


    if (highest) {

        lockedIds.add(
            highest.id
        );

    }


    if (second) {

        lockedIds.add(
            second.id
        );

    }


    const unlocked =
        shuffle(

            dealerCards.filter(
                card =>
                    !lockedIds.has(
                        card.id
                    )
            )

        );


    const numerator =
        [];


    const denominator =
        [];


    if (second) {

        numerator.push(
            second
        );

    }


    if (highest) {

        denominator.push(
            highest
        );

    }


    for (
        const card of unlocked
    ) {

        if (
            Math.random() <
            0.5
        ) {

            numerator.push(
                card
            );

        } else {

            denominator.push(
                card
            );

        }

    }


    applyDealerArrangement({

        numerator,

        denominator

    });

}


/* =========================================================
   ANIMACIONES DEL DEALER
========================================================= */

function getDealerCardPositions() {
    const positions = new Map();

    document
        .querySelectorAll(
            "#dealer-numerator .card[data-card-id], " +
            "#dealer-denominator .card[data-card-id]"
        )
        .forEach(element => {
            const id = Number(element.dataset.cardId);
            const rect = element.getBoundingClientRect();

            positions.set(id, {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            });
        });

    return positions;
}




function animateDealerCards(
    previousPositions = new Map(),
    newCardId = null
) {
    const elements = document.querySelectorAll(
        "#dealer-numerator .card[data-card-id], " +
        "#dealer-denominator .card[data-card-id]"
    );

    const dealerPanel =
        dealerNumerator.parentElement?.parentElement;

    const sourceRect =
        dealerPanel?.getBoundingClientRect();

    let didAnimate = false;

    elements.forEach(element => {
        const id = Number(element.dataset.cardId);
        const target = element.getBoundingClientRect();
        const previous = previousPositions.get(id);

        let dx;
        let dy;
        let duration = 360;

        if (id === newCardId && sourceRect) {
            // La carta nueva comienza en el área del dealer.
            dx =
                sourceRect.left +
                sourceRect.width / 2 -
                (target.left + target.width / 2);

            dy =
                sourceRect.top +
                Math.min(sourceRect.height * 0.35, 90) -
                (target.top + target.height / 2);

            duration = 430;
        } else if (previous) {
            // Las cartas existentes parten de su posición anterior.
            dx = previous.left - target.left;
            dy = previous.top - target.top;

            // Si no se desplazó, no se anima ni se modifica.
            if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                return;
            }
        } else {
            return;
        }

        didAnimate = true;

        const originalZIndex = element.style.zIndex;
        const originalPosition = element.style.position;

        // Elevar la carta sin sacarla del flujo del diseño.
        element.style.position = "relative";
        element.style.zIndex = "9999";

        const animation = element.animate(
            [
                {
                    transform:
                        `translate(${dx}px, ${dy}px)`,
                    opacity: id === newCardId ? 0.4 : 1
                },
                {
                    transform: "translate(0px, 0px)",
                    opacity: 1
                }
            ],
            {
                duration,
                easing: "cubic-bezier(0.22, 0.75, 0.25, 1)"
            }
        );

        const restoreStyles = () => {
            element.style.zIndex = originalZIndex;
            element.style.position = originalPosition;
        };

        animation.onfinish = () => {
            animation.cancel();
            restoreStyles();
        };

        animation.oncancel = restoreStyles;
    });

    return didAnimate;
}




/* =========================================================
   JUEGO DEL DEALER
========================================================= */


async function playDealer() {
    const generation = gameGeneration;

    closeDrawOverlay();

    dealerMessage.textContent =
        "Veamos... voy a organizar mis cartas.";

    renderDealer(true);

    await wait(DEALER_DELAY);
    if (generation !== gameGeneration) return;

    while (dealerCards.length < MAX_CARDS) {

        /*
         * REORGANIZACIÓN INICIAL
         */
        const beforeArrangement =
            getDealerCardPositions();

        const best =
            evaluateArrangement(dealerCards);

        const config =
            DIFFICULTIES[difficulty];

        if (best) {
            if (Math.random() < config.errorChance) {
                randomDealerArrangement();
            } else {
                applyDealerArrangement(best);
            }

            renderDealer(true);

            const rearranged =
                animateDealerCards(beforeArrangement);

            if (rearranged) {
                dealerMessage.textContent =
                    "Déjame ordenar mejor estas cartas...";

                await wait(380);
                if (generation !== gameGeneration) return;
            }
        }

        const score = calculateDealerScore();

        /*
         * COMPROBAR SI EL DEALER PUEDE PLANTARSE
         */
        if (dealerCards.length >= config.minCards) {

            if (
                score >= config.standValue &&
                score <= LIMIT
            ) {
                break;
            }

            /*
             * INTENTAR RECUPERARSE SI SUPERA 25
             */
            if (score > LIMIT) {
                const beforeRecovery =
                    getDealerCardPositions();

                const recovery =
                    evaluateArrangement(dealerCards);

                if (recovery) {
                    applyDealerArrangement(recovery);
                    renderDealer(true);

                    const recoveredLayout =
                        animateDealerCards(beforeRecovery);

                    if (recoveredLayout) {
                        dealerMessage.textContent =
                            "Me pasé... voy a corregir la distribución.";

                        await wait(380);
                        if (generation !== gameGeneration) return;
                    }

                    const recovered =
                        calculateDealerScore();

                    if (
                        recovered <= LIMIT &&
                        recovered >= config.standValue
                    ) {
                        break;
                    }
                }
            }
        }

        /*
         * SACAR UNA CARTA NUEVA
         */
        
        const dealerCanUseJokers = difficulty === "hard";

        const newCard = drawCard(dealerCanUseJokers);

        if (!newCard) break;

        // 1. Guardar posiciones antes de modificar el tablero.
        const beforeDraw = getDealerCardPositions();

        // 2. Añadir la carta.
        dealerCards.push(newCard);

        // 3 y 4. Calcular y aplicar la distribución definitiva.
        const bestAfterDraw = evaluateArrangement(dealerCards);

        if (bestAfterDraw) {
            applyDealerArrangement(bestAfterDraw);
        }

        // 5. Actualizar el tablero directamente con la distribución final.
        renderDealer(true);

        // 6. Animar las cartas desde sus posiciones anteriores.
        playRandomCardSound();

        dealerMessage.textContent = newCard.isJoker
            ? "¡Un Joker! A ver cómo encaja en mi estrategia..."
            : "Voy a sacar otra carta...";

        animateDealerCards(beforeDraw, newCard.id);

        await wait(460);
        if (generation !== gameGeneration) return;

    }

    /*
     * DISTRIBUCIÓN FINAL
     */
    const beforeFinalArrangement =
        getDealerCardPositions();

    const finalBest =
        evaluateArrangement(dealerCards);

    if (finalBest) {
        applyDealerArrangement(finalBest);
    }

    renderDealer(true);

    const finalMoved =
        animateDealerCards(beforeFinalArrangement);

    if (finalMoved) {
        await wait(380);
        if (generation !== gameGeneration) return;
    }

    await wait(250);
    if (generation !== gameGeneration) return;

    dealerMessage.textContent =
        "Ya tengo mi resultado.";

    finishGame();
}



/* =========================================================
   WAIT
========================================================= */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =========================================================
   RENDER DEALER
========================================================= */


function renderDealer(reveal) {
    dealerNumerator.parentElement.style.setProperty(
        "--row-card-count",
        Math.max(1, dealerNumeratorCards.length)
    );

    dealerDenominator.parentElement.style.setProperty(
        "--row-card-count",
        Math.max(1, dealerDenominatorCards.length)
    );

    // Guardar las cartas que ya existen para reutilizarlas.
    const existingCards = new Map();

    document.querySelectorAll(
        "#dealer-numerator .card[data-card-id], " +
        "#dealer-denominator .card[data-card-id]"
    ).forEach(element => {
        existingCards.set(
            Number(element.dataset.cardId),
            element
        );
    });

    function updateRow(container, cards) {
        cards.forEach((card, index) => {
            const hide =
                !reveal &&
                dealerCards.length > 0 &&
                card.id === dealerCards[0].id;

            let element = existingCards.get(card.id);

            // Crear únicamente las cartas que todavía no existen.
            if (!element) {
                element = createCardElement(card, {
                    source: "dealer",
                    hidden: hide
                });
            }

            // Revelar u ocultar la carta correctamente.
            const wasHidden = element.classList.contains("hidden-card");

            if (wasHidden !== hide) {
                const replacement = createCardElement(card, {
                    source: "dealer",
                    hidden: hide
                });

                element.replaceWith(replacement);
                element = replacement;

                existingCards.set(card.id, element);
            }

            // Moverla solo si está en otro contenedor o posición.
            const currentElement = container.children[index];

            if (currentElement !== element) {
                container.insertBefore(
                    element,
                    currentElement || null
                );
            }
        });

        // Retirar únicamente cartas que ya no pertenecen a esta fila.
        const validIds = new Set(cards.map(card => card.id));

        Array.from(container.children).forEach(element => {
            const id = Number(element.dataset.cardId);

            if (!validIds.has(id)) {
                element.remove();
            }
        });
    }

    updateRow(dealerNumerator, dealerNumeratorCards);
    updateRow(dealerDenominator, dealerDenominatorCards);

    dealerCardCount.textContent =
        `${dealerCards.length}/${MAX_CARDS}`;

    dealerScore.textContent = reveal
        ? calculateDealerScore().toFixed(2)
        : "Oculto";
}



/* =========================================================
   RENDER GENERAL
========================================================= */

function render() {

    renderPlayerCards();

    renderPendingCards();


    renderDealer(
        gameOver
    );


    const score =
        calculateScore();


    playerScoreElement.textContent =
        formatScore(score);


    cardCountElement.textContent =
        `${playerCards.length}/${MAX_CARDS}`;


    dealerCardCount.textContent =
        `${dealerCards.length}/${MAX_CARDS}`;


    /*
     * Nunca mostrar un slide vacío.
     */
    if (!trayCard) {

        drawOverlay.classList.remove(
            "open"
        );

        drawOverlay.classList.remove(
            "dragging"
        );

    }


    updateDiscardButton();


    if (
        !gameOver &&
        !dealerPlaying &&
        !trayCard
    ) {

        drawButton.disabled =
            playerCards.length >=
            MAX_CARDS;


        standButton.disabled =
            score > LIMIT ||
            pendingCards.length > 0;

    }


    if (trayCard) {

        drawButton.disabled =
            true;


        standButton.disabled =
            true;

    }


    if (
        score > LIMIT
    ) {

        playerMessage.textContent =
            "Has superado 25. No puedes plantarte.";

        gameStatus.textContent =
            "Puntuación inválida";

    }

}


/* =========================================================
   RENDER JUGADOR
========================================================= */

function renderPlayerCards() {
    numerator.parentElement.style.setProperty("--row-card-count", Math.max(1, numeratorCards.length));
    denominator.parentElement.style.setProperty("--row-card-count", Math.max(1, denominatorCards.length));


    numerator.innerHTML =
        "";


    denominator.innerHTML =
        "";


    for (
        const card of
        numeratorCards
    ) {

        numerator.appendChild(

            createCardElement(
                card,
                {
                    source:
                        "board"
                }
            )

        );

    }


    for (
        const card of
        denominatorCards
    ) {

        denominator.appendChild(

            createCardElement(
                card,
                {
                    source:
                        "board"
                }
            )

        );

    }

}


/* =========================================================
   PENDING
========================================================= */

function renderPendingCards() {

    pendingArea.classList.add(
        "hidden"
    );


    pendingCardElement.innerHTML =
        "";

}


/* =========================================================
   FINAL DE PARTIDA
========================================================= */

function finishGame() {

    gameOver =
        true;


    dealerPlaying =
        false;


    closeDrawOverlay();


    const player =
        calculateScore();


    const dealer =
        calculateDealerScore();


    const playerValid =
        isValidScore(
            player
        );


    const dealerValid =
        isValidScore(
            dealer
        );


    let title =
        "";


    let subtitle =
        "";


    if (
        !playerValid &&
        !dealerValid
    ) {

        title =
            "¡Ambos superaron 25!";


        subtitle =
            "Ninguno consiguió una puntuación válida.";

    }


    else if (!playerValid) {

        title =
            "¡Perdiste!";


        subtitle =
            "Superaste 25.";

    }


    else if (!dealerValid) {

        title =
            "¡Ganaste!";


        subtitle =
            "El Dealer superó 25.";

    }


    else if (
        player >
        dealer
    ) {

        title =
            "¡Ganaste!";


        subtitle =
            "Tu puntuación fue más alta.";

    }


    else if (
        dealer >
        player
    ) {

        title =
            "¡Perdiste!";


        subtitle =
            "El Dealer obtuvo una puntuación más alta.";

    }


    else {

        title =
            "¡Empate!";


        subtitle =
            "Ambos terminaron con la misma puntuación.";

    }


    resultTitle.textContent =
        title;


    resultSubtitle.textContent =
        subtitle;


    resultPlayerScore.textContent =
        formatScore(player);


    resultDealerScore.textContent =
        dealer.toFixed(2);


    resultPlayerCards.textContent =
        `${playerCards.length}/${MAX_CARDS}`;


    resultDealerCards.textContent =
        `${dealerCards.length}/${MAX_CARDS}`;


    resultPlayerValid.textContent =
        playerValid
            ? "Sí"
            : "No";


    resultDealerValid.textContent =
        dealerValid
            ? "Sí"
            : "No";


    resultTaunt.textContent =
        getDealerTaunt(
            player,
            dealer
        );


    playerMessage.textContent =
        "La partida ha terminado.";


    dealerMessage.textContent =
        "Resultado final.";


    gameStatus.textContent =
        "Partida terminada";


    renderDealer(
        true
    );


    resultModal.classList.add(
        "open"
    );

}


/* =========================================================
   MENSAJES DEL DEALER
========================================================= */


function getDealerTaunt(player, dealer) {
    const tied =
        player <= LIMIT &&
        dealer <= LIMIT &&
        Math.abs(player - dealer) < 0.000001;

    const won =
        player <= LIMIT &&
        (dealer > LIMIT || player > dealer);

    const messages = {
        easy: {
            win: [
                "¡¿PERDÍ EN FÁCIL?! Espera, voy a fingir que se me cayó una carta debajo de la mesa.",
                "¡Felicidades! Le ganaste al Dealer con rueditas de entrenamiento.",
                "Disfruta tu victoria. No todos los días alguien consigue humillar a una calculadora con complejo de superioridad.",
                "¡Me ganaste! Voy a necesitar unos minutos para recuperarme de semejante catástrofe."
            ],
            lose: [
                "JAJAJA. ¡PERDISTE EN FÁCIL! ¿Quieres que te ordene las cartas la próxima vez también?",
                "Te puse la dificultad más fácil y aun así encontraste la derrota. Eso ya es una habilidad especial.",
                "No te preocupes, tus cartas tampoco esperaban mucho de ti.",
                "¡Qué partida! Yo puse la dificultad en Fácil, pero tú la pusiste en Imposible."
            ],
            tie: [
                "¿Empatamos en Fácil? Bueno... técnicamente no me ganaste. Me aferraré a eso.",
                "¡Un empate! Ni siquiera pudiste ganarle a mi versión de vacaciones.",
                "Estamos iguales. Qué alivio: por un momento pensé que iba a perder contra alguien que todavía está aprendiendo."
            ]
        },

        normal: {
            win: [
                "Bien jugado. Esta vez elegiste una combinación mejor que la mía.",
                "Victoria merecida. Analizaste las cartas y encontraste la distribución adecuada.",
                "Me superaste por poco. No te acostumbres.",
                "Buena estrategia. Ahora intenta repetirla sin depender tanto de la suerte."
            ],
            lose: [
                "Tenías opciones mejores. Antes de mover una carta, calcula cómo afecta al cociente.",
                "Te acercaste, pero acercarse a 25 no sirve si terminas pasándote.",
                "No te fijes solo en las cartas grandes: las pequeñas pueden ayudarte a controlar el resultado.",
                "La próxima vez compara distintas distribuciones antes de decidirte."
            ],
            tie: [
                "Empate. Ninguno encontró una ventaja decisiva.",
                "Estamos iguales. Revisa las combinaciones posibles; quizá había una distribución mejor.",
                "Ni tú ni yo conseguimos imponernos. Una decisión distinta podría haber cambiado el resultado."
            ]
        },

        hard: {
            win: [
                "Excelente. Encontraste una distribución eficaz y superaste una estrategia exigente.",
                "Victoria merecida. Supiste equilibrar el producto de las filas y el número de cartas.",
                "Bien calculado. No fue solo suerte: tus decisiones marcaron la diferencia.",
                "Me ganaste. Revisa qué decisiones funcionaron para poder repetirlas en otra partida."
            ],
            lose: [
                "Analiza el denominador: aumentarlo reduce el cociente, pero recuerda que el número de cartas también multiplica el resultado.",
                "No busques únicamente una puntuación cercana a 25. Comprueba cómo cambia el resultado al mover cada carta.",
                "Una buena estrategia requiere evaluar ambas filas conjuntamente, no optimizarlas por separado.",
                "Estuviste cerca. Antes de plantarte, compara las distribuciones disponibles y calcula sus resultados."
            ],
            tie: [
                "Empate. Es un resultado sólido contra una estrategia exigente, pero aún puedes revisar tus distribuciones.",
                "Ninguno obtuvo ventaja. Analiza si otra organización habría permitido superar 25 sin exceder el límite.",
                "Bien competido. La próxima vez presta especial atención al efecto multiplicativo de la cantidad de cartas."
            ]
        }
    };

    const difficultyMessages = messages[difficulty] || messages.normal;
    const result = tied ? "tie" : won ? "win" : "lose";
    const options = difficultyMessages[result];

    return options[Math.floor(Math.random() * options.length)];
}



/* =========================================================
   NUEVA PARTIDA
========================================================= */

function resetGame(playStartSound = false) {
    gameGeneration++;

    closeDrawOverlay();


    resultModal.classList.remove(
        "open"
    );


    newGameModal.classList.remove(
        "open"
    );


    roundStarted =
        false;


    gameOver =
        false;


    dealerPlaying =
        false;


    trayCard =
        null;


    trayMode =
        null;


    dragState =
        null;


    draggedCardId =
        null;


    playerCards =
        [];


    dealerCards =
        [];


    numeratorCards =
        [];


    denominatorCards =
        [];


    dealerNumeratorCards =
        [];


    dealerDenominatorCards =
        [];


    pendingCards =
        [];


    /*
     * Nueva baraja de 28.
     */
    deck =
        shuffle(
            createDeck()
        );


    /*
     * Dos cartas del jugador.
     */
    const playerFirst =
    drawCard(false);

    const playerSecond =
        drawCard(false);


    if (playerFirst) {

        playerCards.push(
            playerFirst
        );

    }


    if (playerSecond) {

        playerCards.push(
            playerSecond
        );

    }


    /*
     * Dos cartas del dealer.
     */
    const dealerFirst =
        drawCard(false);


    const dealerSecond =
        drawCard(false);


    if (dealerFirst) {

        dealerCards.push(
            dealerFirst
        );

    }


    if (dealerSecond) {

        dealerCards.push(
            dealerSecond
        );

    }


    initializePlayerLocks();

    initializeDealerLocks();


    difficultyContainer.classList.remove(
        "locked"
    );


    updateDifficultyUI();

    closeDifficultyFlyout();


    gameStatus.textContent =
        "Tu turno";


    playerMessage.textContent =
        "Organiza tus cartas y acércate a 25.";


    dealerMessage.textContent =
        "Estoy observando...";


    drawButton.disabled =
        false;


    standButton.disabled =
        false;


    render();

    // El sonido se reproduce solo cuando el usuario inicia o reinicia
    // una partida, nunca durante la carga inicial de la página.
    if (playStartSound) {
        playSound("start");
    }

}


/* =========================================================
   DIFICULTAD
========================================================= */

function setDifficultyLocked(
    locked
) {

    if (locked) {

        difficultyContainer.classList.add(
            "locked"
        );


        difficultyButton.disabled =
            true;

    }

    else {

        difficultyContainer.classList.remove(
            "locked"
        );


        difficultyButton.disabled =
            false;

    }

}


function updateDifficultyUI() {

    currentDifficulty.textContent =
        DIFFICULTIES[
            difficulty
        ].label;


    difficultyOptions.forEach(
        option => {

            option.classList.toggle(

                "selected",

                option.dataset.difficulty ===
                difficulty

            );

        }
    );


    const descriptions = {

        easy:
            "El Dealer comete muchos errores y normalmente toma más cartas.",

        normal:
            "El Dealer organiza bien sus cartas, pero todavía puede cometer errores.",

        hard:
            "El Dealer busca combinaciones muy cercanas a 25 y comete pocos errores."

    };


    difficultyInfo.textContent =
        descriptions[
            difficulty
        ];


    if (roundStarted) {

        setDifficultyLocked(
            true
        );

    }

    else {

        setDifficultyLocked(
            false
        );

    }

}


/* =========================================================
   FLYOUT DIFICULTAD
========================================================= */

function closeDifficultyFlyout() {

    difficultyFlyout.classList.remove(
        "open"
    );

}


difficultyButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        if (roundStarted) {
            return;
        }


        difficultyFlyout.classList.toggle(
            "open"
        );

    }
);


difficultyOptions.forEach(
    option => {

        option.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                if (roundStarted) {
                    return;
                }


                const selected =
                    option.dataset.difficulty;


                if (
                    !DIFFICULTIES[
                        selected
                    ]
                ) {

                    return;

                }


                difficulty =
                    selected;


                updateDifficultyUI();

                closeDifficultyFlyout();

            }
        );

    }
);


document.addEventListener(
    "click",
    event => {

        if (
            !difficultyContainer.contains(
                event.target
            )
        ) {

            closeDifficultyFlyout();

        }

    }
);


/* =========================================================
   REGLAS
========================================================= */

rulesButton.addEventListener(
    "click",
    () => {

        rulesModal.classList.add(
            "open"
        );

    }
);


closeRules.addEventListener(
    "click",
    () => {

        rulesModal.classList.remove(
            "open"
        );

    }
);


rulesModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            rulesModal
        ) {

            rulesModal.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   NUEVA PARTIDA
========================================================= */

restartButton.addEventListener(
    "click",
    () => {

        if (
            resultModal.classList.contains(
                "open"
            )
        ) {

            return;

        }


        newGameModal.classList.add(
            "open"
        );

    }
);


cancelNewGame.addEventListener(
    "click",
    () => {

        newGameModal.classList.remove(
            "open"
        );

    }
);


confirmNewGame.addEventListener(
    "click",
    () => {

        resetGame(true);

    }
);


newGameModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            newGameModal
        ) {

            newGameModal.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   RESULTADO
========================================================= */

resultNewGame.addEventListener(
    "click",
    () => {

        resetGame(true);

    }
);


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        /*
         * Resultado permanente.
         */
        if (
            resultModal.classList.contains(
                "open"
            )
        ) {

            return;

        }


        if (
            rulesModal.classList.contains(
                "open"
            )
        ) {

            rulesModal.classList.remove(
                "open"
            );

            return;

        }


        if (
            newGameModal.classList.contains(
                "open"
            )
        ) {

            newGameModal.classList.remove(
                "open"
            );

            return;

        }


        closeDifficultyFlyout();

    }
);


/* =========================================================
   SEGURIDAD
========================================================= */

window.addEventListener(
    "blur",
    () => {

        if (!dragState) {
            return;
        }


        cleanupDrag();

        render();

    }
);


/* =========================================================
   INICIO
========================================================= */

resetGame();