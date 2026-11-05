const { add, subtract, multiply, divide, isEven } = require('./mathUtils');

test('1. Adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
});

test('2. Subtracts two numbers correctly', () => {
    expect(subtract(5, 2)).toBe(3);
});

test('3. Multiplies two numbers correctly', () => {
    expect(multiply(3, 4)).toBe(12);
});

test('4. Throws an error when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow("Cannot divide by zero");
});

test('5. Identifies even numbers properly', () => {
    expect(isEven(4)).toBe(true);
});
