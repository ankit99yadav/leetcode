const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Problem = require('../src/models/problem');

const connect = async () => {
  const connStr = process.env.DB_CONNECT_STRING;
  const dbName = process.env.DB_NAME || 'leetcode';
  await mongoose.connect(connStr, { dbName });
  console.log('MongoDB connected to DB:', dbName);
};

const updates = {
  'Two Sum': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};' },
      { language: 'c++', initialCode: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};' },
      { language: 'java', initialCode: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}' }
    ]
  },
  'Best Time to Buy and Sell Stock': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};' },
      { language: 'c++', initialCode: 'class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};' },
      { language: 'java', initialCode: 'class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}' }
    ]
  },
  'Reverse Linked List': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};' },
      { language: 'c++', initialCode: '/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};' },
      { language: 'java', initialCode: '/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}' }
    ]
  },
  'Number of Islands': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    \n};' },
      { language: 'c++', initialCode: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};' },
      { language: 'java', initialCode: 'class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}' }
    ]
  },
  'Climbing Stairs': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};' },
      { language: 'c++', initialCode: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};' },
      { language: 'java', initialCode: 'class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}' }
    ]
  },
  '3Sum': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};' },
      { language: 'c++', initialCode: 'class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};' },
      { language: 'java', initialCode: 'class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}' }
    ]
  },
  'Course Schedule': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {boolean}\n */\nvar canFinish = function(numCourses, prerequisites) {\n    \n};' },
      { language: 'c++', initialCode: 'class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};' },
      { language: 'java', initialCode: 'class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        \n    }\n}' }
    ]
  },
  'Coin Change': {
    startCode: [
      { language: 'javascript', initialCode: '/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};' },
      { language: 'c++', initialCode: 'class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};' },
      { language: 'java', initialCode: 'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}' }
    ]
  }
};

async function run() {
  await connect();
  
  for (const [title, data] of Object.entries(updates)) {
    const res = await Problem.updateOne({ title }, { $set: { startCode: data.startCode } });
    console.log(`Updated ${title}: ${res.modifiedCount} modified`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
