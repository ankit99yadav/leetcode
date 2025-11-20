const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connect = async () => {
  const connStr = process.env.DB_CONNECT_STRING;
  const dbName = process.env.DB_NAME || 'leetcode';
  await mongoose.connect(connStr, { dbName });
  console.log('MongoDB connected to DB:', dbName);
};

const User = require('../src/models/user');
const Problem = require('../src/models/problem');

async function ensureAdmin() {
  let admin = await User.findOne({ role: 'admin' }).lean();
  if (admin) return admin;
  const password = await bcrypt.hash('Admin@123', 10);
  const doc = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    emailId: 'admin@leetcode.local',
    password,
    role: 'admin'
  });
  console.log('Admin user created:', doc.emailId);
  return doc.toObject();
}

function samples(adminId) {
  return [
    {
      title: 'Two Sum',
      description: 'Find indices of two numbers that add up to target.',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [
        { input: 'nums=[2,7,11,15], target=9', output: '[0,1]', explanation: '2+7=9' }
      ],
      hiddenTestCases: [ { input: 'nums=[3,2,4], target=6', output: '[1,2]' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};' },
        { language: 'c++', initialCode: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};' },
        { language: 'java', initialCode: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function twoSum(nums, target){ const m=new Map(); for(let i=0;i<nums.length;i++){ const need=target-nums[i]; if(m.has(need)) return [m.get(need), i]; m.set(nums[i], i);} return []; }' }],
      problemCreator: adminId
    },
    {
      title: 'Best Time to Buy and Sell Stock',
      description: 'Max profit from single buy-sell.',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [ { input: 'prices=[7,1,5,3,6,4]', output: '5', explanation: 'buy 1, sell 6' } ],
      hiddenTestCases: [ { input: 'prices=[7,6,4,3,1]', output: '0' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};' },
        { language: 'c++', initialCode: 'class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};' },
        { language: 'java', initialCode: 'class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function maxProfit(prices){ let min=Infinity,ans=0; for(const p of prices){ min=Math.min(min,p); ans=Math.max(ans,p-min);} return ans; }' }],
      problemCreator: adminId
    },
    {
      title: 'Reverse Linked List',
      description: 'Reverse a singly linked list.',
      difficulty: 'easy',
      tags: 'linkedList',
      visibleTestCases: [ { input: 'head=[1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'reverse order' } ],
      hiddenTestCases: [ { input: 'head=[]', output: '[]' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};' },
        { language: 'c++', initialCode: '/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};' },
        { language: 'java', initialCode: '/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function reverseList(head){ let prev=null,cur=head; while(cur){ const nxt=cur.next; cur.next=prev; prev=cur; cur=nxt;} return prev; }' }],
      problemCreator: adminId
    },
    {
      title: 'Number of Islands',
      description: 'Count islands in a 2D grid of 0/1.',
      difficulty: 'medium',
      tags: 'graph',
      visibleTestCases: [ { input: 'grid=[["1","1","0"],["0","1","0"],["1","0","1"]]', output: '3', explanation: 'three islands' } ],
      hiddenTestCases: [ { input: 'grid=[["1"]]', output: '1' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    \n};' },
        { language: 'c++', initialCode: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};' },
        { language: 'java', initialCode: 'class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function numIslands(g){ if(!g||!g.length) return 0; const m=g.length,n=g[0].length; let cnt=0; const dfs=(i,j)=>{ if(i<0||j<0||i>=m||j>=n||g[i][j]!="1") return; g[i][j]="0"; dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1); }; for(let i=0;i<m;i++){ for(let j=0;j<n;j++){ if(g[i][j]==="1"){ cnt++; dfs(i,j); } } } return cnt; }' }],
      problemCreator: adminId
    },
    {
      title: 'Climbing Stairs',
      description: 'Ways to climb n stairs (1 or 2 steps).',
      difficulty: 'easy',
      tags: 'dp',
      visibleTestCases: [ { input: 'n=2', output: '2', explanation: '1+1, 2' } ],
      hiddenTestCases: [ { input: 'n=3', output: '3' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};' },
        { language: 'c++', initialCode: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};' },
        { language: 'java', initialCode: 'class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function climbStairs(n){ let a=1,b=1; for(let i=0;i<n;i++){ [a,b]=[b,a+b]; } return a; }' }],
      problemCreator: adminId
    },
    {
      title: '3Sum',
      description: 'Find unique triplets that sum to zero.',
      difficulty: 'medium',
      tags: 'array',
      visibleTestCases: [ { input: 'nums=[-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'two triplets' } ],
      hiddenTestCases: [ { input: 'nums=[]', output: '[]' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};' },
        { language: 'c++', initialCode: 'class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};' },
        { language: 'java', initialCode: 'class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function threeSum(nums){ nums.sort((a,b)=>a-b); const res=[]; for(let i=0;i<nums.length-2;i++){ if(i&&nums[i]===nums[i-1]) continue; let l=i+1,r=nums.length-1; while(l<r){ const s=nums[i]+nums[l]+nums[r]; if(s===0){ res.push([nums[i],nums[l],nums[r]]); while(l<r&&nums[l]===nums[l+1]) l++; while(l<r&&nums[r]===nums[r-1]) r--; l++; r--; } else if(s<0) l++; else r--; } } return res; }' }],
      problemCreator: adminId
    },
    {
      title: 'Course Schedule',
      description: 'Can finish all courses given prerequisites?',
      difficulty: 'medium',
      tags: 'graph',
      visibleTestCases: [ { input: 'numCourses=2, prerequisites=[[1,0]]', output: 'true', explanation: '0->1' } ],
      hiddenTestCases: [ { input: 'numCourses=2, prerequisites=[[1,0],[0,1]]', output: 'false' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {boolean}\n */\nvar canFinish = function(numCourses, prerequisites) {\n    \n};' },
        { language: 'c++', initialCode: 'class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};' },
        { language: 'java', initialCode: 'class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function canFinish(n,pre){ const indeg=Array(n).fill(0); const adj=Array(n).fill(0).map(()=>[]); for(const [a,b] of pre){ indeg[a]++; adj[b].push(a);} const q=[]; for(let i=0;i<n;i++) if(!indeg[i]) q.push(i); let cnt=0; while(q.length){ const u=q.shift(); cnt++; for(const v of adj[u]){ if(--indeg[v]===0) q.push(v); } } return cnt===n; }' }],
      problemCreator: adminId
    },
    {
      title: 'Coin Change',
      description: 'Fewest coins to make amount.',
      difficulty: 'medium',
      tags: 'dp',
      visibleTestCases: [ { input: 'coins=[1,2,5], amount=11', output: '3', explanation: '5+5+1' } ],
      hiddenTestCases: [ { input: 'coins=[2], amount=3', output: '-1' } ],
      startCode: [
        { language: 'javascript', initialCode: '/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};' },
        { language: 'c++', initialCode: 'class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};' },
        { language: 'java', initialCode: 'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}' }
      ],
      referenceSolution: [{ language: 'JavaScript', completeCode: 'function coinChange(coins,amount){ const dp=Array(amount+1).fill(Infinity); dp[0]=0; for(const c of coins){ for(let a=c;a<=amount;a++){ dp[a]=Math.min(dp[a], dp[a-c]+1); } } return dp[amount]===Infinity?-1:dp[amount]; }' }],
      problemCreator: adminId
    }
  ];
}

async function run() {
  await connect();
  const admin = await ensureAdmin();
  const count = await Problem.countDocuments();
  if (count > 0) {
    console.log(`Problems already present: ${count}. Skip seeding.`);
    await mongoose.disconnect();
    return;
  }
  const docs = samples(admin._id);
  await Problem.insertMany(docs);
  console.log(`Seeded ${docs.length} problems.`);
  await mongoose.disconnect();
}

run().catch(async (e) => { console.error(e); try{ await mongoose.disconnect(); }catch{} process.exit(1); });
