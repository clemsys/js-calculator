const precision = 0.001;

const coo = {
    '.': [1,5],
    '+': [4,5],
    '-': [4,4],
    '*': [4,3],
    '/': [4,2],
    '=': [3,5],
    '\u232B': [4,1], //delete
    '^': [3,1],
    '(': [1,1],
    ')': [2,1]
};

const left_associative = {
    '+': true,
    '-': true,
    '*': true,
    '/': true,
    '^': false,
};

let screenTextContent = '';

const keypad = document.querySelector('#keypad');
const screenResult = document.querySelector('#screen-result');
const screenContent = document.querySelector('#screen-content');
screenContent.textContent = screenTextContent;

function isOneDigitNumeric(c) {
    if (c >= '0' && c <= '9' || c == '.') {
        return true;
    }
    return false;
}

function isNumber(s) {
    return isOneDigitNumeric(s.charAt(0));
}

function priority(c) {
    switch (c) {
        case '+':
            return 1;
            break;
        case '-':
            return 1;
            break;
        case '*':
            return 2;
            break;
        case '/':
            return 2;
            break;
        case '^':
            return 3;
            break;
        default:
            return 0;
            break;
    }
}

function compute() {
    // process characters queue to make numbers out of many numerical characters
    operationsQueue = [];
    for (let i = 0; i < screenTextContent.length; i++) {
        const c = screenTextContent[i];
        const lastElement = (operationsQueue.length != 0) ? operationsQueue[operationsQueue.length - 1] : '+';
        if (isOneDigitNumeric(c)) {
            if (isNumber(lastElement)) {
                if (c == '.' && lastElement.charAt(lastElement.length - 1) == '.') {
                    // do nothing
                }
                else {
                    operationsQueue[operationsQueue.length - 1] += c;
                }
            }
            else {
                operationsQueue.push(c);
            }
        }
        else {
            operationsQueue.push(c);
        } 
    }

    // shunting-yard algorithm
    let output = [];
    let stack = [];

    operationsQueue.forEach(s => {
        if (isNumber(s)) {
            output.push(s);
        }
        else if (s == '(') {
            stack.push(s);
        }
        else if (s == ')') {
            while (stack.length > 0 && stack[stack.length - 1] != '(') {
                const op = stack.pop();
                output.push(op);
            }
            if (stack.length == 0) {
                return 'wrong expr.';
            }
            else {
                stack.pop();
            }
        }
        else { // s is an operator
            while (stack.length > 0 && ((priority(s) <= priority(stack[stack.length - 1] ) && left_associative[s]) || (priority(s) < priority(stack[stack.length - 1] ) && !left_associative[s]))) {
                const op = stack.pop();
                output.push(op);
            }
            stack.push(s);
        }
    });

    const stackLength = stack.length;
    for (let i = 0; i < stackLength; i++) {
        const op = stack.pop();
        if (op == '(') {
            return 'wrong expr.';
        }
        output.push(op);
    }

    // actual computation
    computationStack = [];
    let i = 0;
    while (i < output.length) {
        while (i < output.length && isNumber(output[i])) {
            computationStack.push(parseFloat(output[i]));
            i++;
        }
        if (computationStack.length == 1) {
            return 'wrong expr.';
        }
        else if (computationStack.length > 1) {
            const b = computationStack.pop();
            const a = computationStack.pop();
            if (!(typeof a == 'number' && typeof b == 'number')) {
                return 'wrong expr.';
            }
            let c = 0;
            switch (output[i]) {
                case '+':
                    c = a + b;
                    break;
                case '-':
                    c = a - b;
                    break;
                case '*':
                    c = a * b;
                    break;
                case '/':
                    c = a / b;
                    break;
                case '^':
                    c = Math.pow(a, b);
                    break;
                default:
                    return 'wrong expr.';
                    break;
            }
            computationStack.push(c);
            i++;
        }
    }
    return parseFloat(Math.round(computationStack[0]/precision)*precision);
}

function registerKey(c) {
    if (c == '=') {
        if (screenTextContent.length > 0) {
            const requestCopy = (' ' + screenTextContent).slice(1);;
            screenContent.textContent = requestCopy;
            const result = compute();
            screenResult.textContent = result;
            screenTextContent = '';
        }
    }
    else {
        if (screenTextContent.length == 0) {
            screenResult.textContent = '';
        }
        if (c == '\u232B') {
            screenTextContent = screenTextContent.slice(0,-1);
        }
        else {
            screenContent.textContent += c;
            screenTextContent += c;
        }
        screenContent.textContent = screenTextContent;
    }
}

function createButton (name) {
    const button = document.createElement('div');
    button.classList.add('button');
    button.classList.add('button-mouseout');
    button.textContent = name;
    button.addEventListener('click', function() {
        registerKey(name);
    });
    button.addEventListener('mouseover', function() {
        button.classList.add('button-mouseover');
        button.classList.remove('button-mouseout');
    });
    button.addEventListener('mouseout', function() {
        button.classList.add('button-mouseout');
        button.classList.remove('button-mouseover');
    });
    keypad.appendChild(button);
    return button;
}

// create numerical buttons
for (let i = 0; i < 10; i++) {
    const button = createButton(`${i}`);
    if (i == 0) {
        button.setAttribute('style','grid-column: 2; grid-row: 5');
    }
    else {
        button.setAttribute('style',`grid-column: ${(i-1)%3 + 1}; grid-row: ${4 - Math.floor((i-1)/3)}`);
    }
}

// create other buttons
for (let k in coo) {
    const button = createButton(k);
    [col, row] = coo[k];
    button.setAttribute('style',`grid-column: ${col}; grid-row: ${row}`);
}

// listen to keyboard
document.addEventListener('keydown', function(event) {
    const allowedKeys = ['+','-','*','/','(',')','^','='];
    const c = event.key;
    if (allowedKeys.includes(c) || isOneDigitNumeric(c)) {
        if (c == '/') {
            event.preventDefault();
        }
        registerKey(c);
    }
    else if (c == 'Backspace') {
        registerKey('\u232B');
    }
    else if (c == 'Enter') {
        registerKey('=');
    }
});