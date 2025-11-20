const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connect = async () => {
  const connStr = process.env.DB_CONNECT_STRING;
  const dbName = process.env.DB_NAME || 'leetcode';
  await mongoose.connect(connStr, { dbName });
  console.log('MongoDB connected to DB:', dbName);
};

const User = require('../src/models/user');
const Problem = require('../src/models/problem');

async function addTestProblem() {
  await connect();
  
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log('No admin user found');
    return;
  }

  const simpleTestProblem = {
    title: 'Add Two Numbers (Test)',
    description: 'Write a function that takes two integers as input and returns their sum.',
    difficulty: 'easy',
    tags: 'array',
    visibleTestCases: [
      { 
        input: '2 3', 
        output: '5', 
        explanation: '2 + 3 = 5' 
      },
      { 
        input: '10 15', 
        output: '25', 
        explanation: '10 + 15 = 25' 
      }
    ],
    hiddenTestCases: [
      { input: '1 1', output: '2' },
      { input: '0 5', output: '5' },
      { input: '-2 3', output: '1' }
    ],
    startCode: [
      { 
        language: 'JavaScript', 
        initialCode: `// Read input from stdin
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const [a, b] = input.split(' ').map(Number);
  
  // Your code here: calculate sum of a and b
  const result = a + b;
  
  console.log(result);
  rl.close();
});`
      },
      { 
        language: 'Java', 
        initialCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        
        // Your code here: calculate sum of a and b
        int result = a + b;
        
        System.out.println(result);
        scanner.close();
    }
}`
      },
      { 
        language: 'C++', 
        initialCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    
    // Your code here: calculate sum of a and b
    int result = a + b;
    
    cout << result << endl;
    return 0;
}`
      }
    ],
    referenceSolution: [
      { 
        language: 'JavaScript', 
        completeCode: `const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const [a, b] = input.split(' ').map(Number);
  console.log(a + b);
  rl.close();
});`
      }
    ],
    problemCreator: admin._id
  };

  await Problem.create(simpleTestProblem);
  console.log('Simple test problem added for Judge0 testing');
  
  await mongoose.disconnect();
}

addTestProblem().catch(async (e) => { 
  console.error(e); 
  try{ await mongoose.disconnect(); }catch{} 
  process.exit(1); 
});