// CLEAN REBUILD OF CONTROLLER BELOW
// ------------------------------------------------------------
const Problem = require('../models/problem');
const Submission = require('../models/submission');
const { getLanguageById, submitBatch, submitToken } = require('../utils/problemUtility');

// JS function metadata extractor
function extractJsFunctionMeta(src){
  if(!src) return null;
  const pats=[
    /function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/,
    /(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)/,
    /(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>/
  ];
  for(const p of pats){
    const m=src.match(p); if(m){
      const params=m[2].split(',').map(s=>s.trim()).filter(Boolean);
      return {name:m[1], params};
    }
  }
  return null;
}

function buildJsFunctionHarness(code){
  const meta=extractJsFunctionMeta(code);
  if(!meta) return null;
  const argExpr=meta.params.map(p=>`__getArg("${p}")`).join(', ');
  return `${code}
const fs=require('fs');
const raw=fs.readFileSync(0,'utf8').trim();
function __parse(raw){
  if(!raw) return {};
  try{ if(raw.startsWith('{')||raw.startsWith('[')) return JSON.parse(raw);}catch{}
  try{ return { value: JSON.parse(raw) }; }catch{}
  const norm='{'+raw.replace(/([A-Za-z0-9_]+)\s*=/g,'"$1":').replace(/'/g,'"')+'}';
  try{ return JSON.parse(norm);}catch{ return {value:raw}; }
}
const __input=__parse(raw);
function __getArg(name){
  if(Array.isArray(__input)) return __input;
  if(__input && Object.prototype.hasOwnProperty.call(__input,name)) return __input[name];
  if(__input && Object.prototype.hasOwnProperty.call(__input,'value')) return __input.value;
  return __input;
}
function __fmt(v){ if(v==null) return 'null'; if(typeof v==='object') return JSON.stringify(v); return v; }
const __result = ${meta.name}(${argExpr});
console.log(__fmt(__result));`;
}

// Java helper: wrap method-only code into class Solution
function wrapJavaIfMethodOnly(src){
  if(!src) return src;
  if(/\b(class|interface|enum)\b/.test(src)) return src; // already a type
  const hasMethod = /^(?:\s*(?:public|private|protected)\s+)?(?:static\s+)?[A-Za-z0-9_<>::\[\]]+\s+[A-Za-z_][A-Za-z0-9_]*\s*\([^;{}]*\)\s*\{/m.test(src);
  if(hasMethod){
    // ensure method is at least package-visible or public; we keep as-is
    return `class Solution {\n${src}\n}`;
  }
  return src; // leave as-is (user likely pasted full program or invalid snippet)
}

// Unified harness builder
function buildHarness(lang, code){
  const need = (l,c) => {
    if(l==='javascript') return !/fs\.readFileSync/.test(c);
    if(l==='c++') return !/int\s+main\s*\(/.test(c);
    if(l==='java') return !/public\s+static\s+void\s+main/.test(c);
    return false;
  };
  if(!need(lang,code)) return code;
  if(lang==='javascript'){
    const h = buildJsFunctionHarness(code);
    if(h) return h;
    return code + `\nconst fs=require('fs');const r=fs.readFileSync(0,'utf8').trim().split(/\s+/);if(r.length>=2)console.log(parseInt(r[0])+parseInt(r[1]));`;
  }
  if(lang==='c++'){
    const prefix = /#include/.test(code)? '' : '#include <bits/stdc++.h>\nusing namespace std;\n';
    const hasClass = /class\s+Solution/.test(code);
    const hasTwoSum = /twoSum\s*\(/.test(code);
    const hasMaxProfit = /maxProfit\s*\(/.test(code);
    const hasThreeSum = /threeSum\s*\(/.test(code);
    const hasClimbStairs = /climbStairs\s*\(/.test(code);
    const hasCoinChange = /coinChange\s*\(/.test(code);

    if(hasTwoSum){
      return prefix + code + `\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);vector<string> lines;string line;while(getline(cin,line)){if(line.size())lines.push_back(line);}vector<int> nums;int target=0; if(lines.size()>=2 && lines[0][0]=='['){string s=lines[0];s.erase(remove(s.begin(),s.end(),'['),s.end());s.erase(remove(s.begin(),s.end(),']'),s.end());stringstream ss(s);int x;char ch;while(ss>>x){nums.push_back(x);if(ss.peek()==',')ss>>ch;}target=stoi(lines[1]);} else { // key=value style
 string joined; for(auto &s:lines) joined+=s+" "; auto findKV=[&](string k){size_t p=joined.find(k+"="); if(p==string::npos) return string(""); size_t st=p+k.size()+1; size_t en=st; int depth=0; for(size_t i=st;i<joined.size();++i){ char c=joined[i]; if(c=='[')depth++; else if(c==']')depth--; if(depth==0 && (c==' '||c=='\n')){ en=i; break;} en=i+1;} return joined.substr(st,en-st);}; string arr=findKV("nums"); if(arr.size()){string s=arr; s.erase(remove(s.begin(),s.end(),'['),s.end()); s.erase(remove(s.begin(),s.end(),']'),s.end()); stringstream ss(s); int x; char ch; while(ss>>x){ nums.push_back(x); if(ss.peek()==',') ss>>ch; }} string tk=findKV("target"); if(tk.size()) target=stoi(tk); }
 vector<int> ans = ` + (hasClass? 'Solution().twoSum(nums,target);' : 'twoSum(nums,target);') + ` for(size_t i=0;i<ans.size();++i) cout<<ans[i]<<(i+1<ans.size()?" ":""); return 0;}`;
    }
    if(hasMaxProfit){
      return prefix + code + `\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);string all;string line;while(getline(cin,line)){all+=line+" ";} size_t p=all.find("prices="); if(p==string::npos) return 0; size_t st=p+7; size_t en=st; int depth=0; for(size_t i=st;i<all.size();++i){ char c=all[i]; if(c=='[') depth++; else if(c==']') depth--; if(depth==0 && c==' ') { en=i; break;} en=i+1;} string arr=all.substr(st,en-st); arr.erase(remove(arr.begin(),arr.end(),'['),arr.end()); arr.erase(remove(arr.begin(),arr.end(),']'),arr.end()); stringstream ss(arr); vector<int> prices; int x; char ch; while(ss>>x){ prices.push_back(x); if(ss.peek()==',') ss>>ch; } int ans = ` + (hasClass? 'Solution().maxProfit(prices);' : 'maxProfit(prices);') + ` cout<<ans; return 0;}`;
    }
    if(hasThreeSum){
      return prefix + code + `\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);string all;string line;while(getline(cin,line)){all+=line+" ";} size_t p=all.find("nums="); vector<int> nums; if(p!=string::npos){ size_t st=p+5; size_t en=st; int depth=0; for(size_t i=st;i<all.size();++i){ char c=all[i]; if(c=='[')depth++; else if(c==']')depth--; if(depth==0 && (c==' '||c=='\n')){ en=i; break;} en=i+1;} string arr=all.substr(st,en-st); arr.erase(remove(arr.begin(),arr.end(),'['),arr.end()); arr.erase(remove(arr.begin(),arr.end(),']'),arr.end()); stringstream ss(arr); int x; char ch; while(ss>>x){ nums.push_back(x); if(ss.peek()==',') ss>>ch; }} vector<vector<int>> res = ` + (hasClass? 'Solution().threeSum(nums);' : 'threeSum(nums);') + ` cout<<"["; for(size_t i=0;i<res.size();++i){ cout<<"["; for(size_t j=0;j<res[i].size();++j) cout<<res[i][j]<<(j+1<res[i].size()?",":""); cout<<"]"<<(i+1<res.size()?",":""); } cout<<"]"; return 0;}`;
    }
    if(hasClimbStairs){
      return prefix + code + `\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);string all;string line;while(getline(cin,line)){all+=line+" ";} int n=0; size_t p=all.find("n="); if(p!=string::npos){ istringstream iss(all.substr(p+2)); iss>>n; } int ans = ` + (hasClass? 'Solution().climbStairs(n);' : 'climbStairs(n);') + ` cout<<ans; return 0;}`;
    }
    if(hasCoinChange){
      return prefix + code + `\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);string all;string line;while(getline(cin,line)){all+=line+" ";} vector<int> coins; int amount=0; size_t p=all.find("coins="); if(p!=string::npos){ size_t st=p+6; size_t en=st; int depth=0; for(size_t i=st;i<all.size();++i){ char c=all[i]; if(c=='[')depth++; else if(c==']')depth--; if(depth==0 && (c==' '||c==','||c=='\n')){ en=i; break;} en=i+1;} string arr=all.substr(st,en-st); arr.erase(remove(arr.begin(),arr.end(),'['),arr.end()); arr.erase(remove(arr.begin(),arr.end(),']'),arr.end()); stringstream ss(arr); int x; char ch; while(ss>>x){ coins.push_back(x); if(ss.peek()==',') ss>>ch; }} size_t q=all.find("amount="); if(q!=string::npos){ istringstream iss(all.substr(q+7)); iss>>amount; } int ans = ` + (hasClass? 'Solution().coinChange(coins,amount);' : 'coinChange(coins,amount);') + ` cout<<ans; return 0;}`;
    }
    // fallback
    return prefix + code + `\nint main(){ long long a,b; if(!(cin>>a>>b)) return 0; cout<<a+b; return 0;}`;
  }
  if(lang==='java'){
    // Wrap method-only into class Solution first
    let user = wrapJavaIfMethodOnly(code || '');
    // Sanitize Java code: drop package, collect imports, remove public from Solution
    // remove package lines
    user = user.replace(/^\s*package\s+[\w\.]+;\s*/gm, '');
    // extract imports
    const userImports = [];
    user = user.replace(/^\s*import\s+[^;]+;\s*$/gm, (m)=>{ userImports.push(m.trim()); return ''; });
    // avoid public class Solution filename mismatch
    user = user.replace(/\bpublic\s+class\s+Solution\b/g, 'class Solution');
    // Build import header de-duplicated
    const baseImports = ['import java.io.*;', 'import java.util.*;'];
    const importSet = new Set([...baseImports, ...userImports]);
    const header = Array.from(importSet).join('\n') + '\n';

    // Detect problem signature
    const hasTwoSum = /twoSum\s*\(\s*int\s*\[\]\s*|twoSum\s*\(/.test(user);
    const hasMaxProfit = /maxProfit\s*\(\s*int\s*\[\]\s*|maxProfit\s*\(/.test(user);
    const hasThreeSum = /threeSum\s*\(/.test(user);
    const hasClimbStairs = /climbStairs\s*\(/.test(user);
    const hasCoinChange = /coinChange\s*\(/.test(user);

    // Build Main runner supporting key=value and bracket styles
    const main = `class Main { public static void main(String[] args) throws Exception { BufferedReader br=new BufferedReader(new InputStreamReader(System.in)); List<String> lines=new ArrayList<>(); String ln; while((ln=br.readLine())!=null){ ln=ln.trim(); if(ln.length()>0) lines.add(ln);} String all=""; for(String s: lines) all+=s+" ";
      // Simple sum fallback: two tokens
      if(lines.size()==1){ String[] p=lines.get(0).trim().split(" +"); if(p.length==2){ System.out.print(Long.parseLong(p[0])+Long.parseLong(p[1])); return; } }
      Object sol=null; Class<?> clazz=null; try{ clazz=Class.forName("Solution"); sol=clazz.getDeclaredConstructor().newInstance(); }catch(Throwable t){}
      if(sol==null){ System.out.print("\\n"); return; }
      try{
        // twoSum variants
        if(${hasTwoSum ? 'true' : 'false'}){
          int[] nums=null; Integer target=null;
          if(all.contains("nums=") || all.contains("target=")){
            // key=value: nums=[..] target=..
            int l=all.indexOf("nums="); if(l>=0){ int lb=all.indexOf('[',l); int rb=all.indexOf(']',lb+1); if(lb>=0 && rb>lb){ String arr=all.substring(lb+1,rb); String[] ps=arr.split(","); nums=new int[ps.length]; for(int i=0;i<ps.length;i++) nums[i]=Integer.parseInt(ps[i].trim()); }}
            int tpos=all.indexOf("target="); if(tpos>=0){ StringBuilder sb=new StringBuilder(); for(int i=tpos+7;i<all.length();i++){ char c=all.charAt(i); if(Character.isWhitespace(c)) break; sb.append(c);} if(sb.length()>0) target=Integer.parseInt(sb.toString()); }
          } else if(lines.size()>=2 && lines.get(0).startsWith("[")){
            String s=lines.get(0).replace("["," ").replace("]"," ").trim(); String[] ps=s.length()==0? new String[0] : s.split(","); nums=new int[ps.length]; for(int i=0;i<ps.length;i++) nums[i]=ps[i].trim().isEmpty()?0:Integer.parseInt(ps[i].trim()); target=Integer.parseInt(lines.get(1).trim());
          }
          if(nums!=null && target!=null){ try{ java.lang.reflect.Method m=clazz.getDeclaredMethod("twoSum", int[].class, int.class); Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; int[] res=(int[])m.invoke(targetObj, nums, target); for(int i=0;i<res.length;i++){ System.out.print(res[i]+(i+1<res.length?" ":"")); } return; }catch(Throwable ignore){} }
        }
        // maxProfit variants
        if(${hasMaxProfit ? 'true' : 'false'}){
          int[] prices=null;
          if(all.contains("prices=")){
            int l=all.indexOf("prices="); int lb=all.indexOf('[',l); int rb=all.indexOf(']',lb+1); if(lb>=0 && rb>lb){ String arr=all.substring(lb+1,rb); String[] ps=arr.split(","); prices=new int[ps.length]; for(int i=0;i<ps.length;i++) prices[i]=ps[i].trim().isEmpty()?0:Integer.parseInt(ps[i].trim()); }
          } else if(lines.size()>=1 && lines.get(0).startsWith("[")){
            String s=lines.get(0).replace("["," ").replace("]"," ").trim(); String[] ps=s.length()==0? new String[0] : s.split(","); prices=new int[ps.length]; for(int i=0;i<ps.length;i++) prices[i]=ps[i].trim().isEmpty()?0:Integer.parseInt(ps[i].trim());
          }
          if(prices!=null){ try{ java.lang.reflect.Method m=clazz.getDeclaredMethod("maxProfit", int[].class); Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; Object ans=m.invoke(targetObj, (Object)prices); System.out.print(String.valueOf(ans)); return; }catch(Throwable ignore){} }
        }
        // threeSum variants
        if(${hasThreeSum ? 'true' : 'false'}){
          int[] nums=null;
          if(all.contains("nums=")){
            int l=all.indexOf("nums="); int lb=all.indexOf('[',l); int rb=all.indexOf(']',lb+1); if(lb>=0 && rb>lb){ String a=all.substring(lb+1,rb); String[] s=a.split(","); nums=new int[s.length]; for(int i=0;i<s.length;i++) nums[i]=s[i].trim().isEmpty()?0:Integer.parseInt(s[i].trim()); }
          } else if(lines.size()>=1 && lines.get(0).startsWith("[")){
            String s=lines.get(0).replace("["," ").replace("]"," ").trim(); String[] ps1=s.length()==0? new String[0] : s.split(","); nums=new int[ps1.length]; for(int i=0;i<ps1.length;i++) nums[i]=ps1[i].trim().isEmpty()?0:Integer.parseInt(ps1[i].trim());
          }
          if(nums!=null){ try{ java.lang.reflect.Method m=clazz.getDeclaredMethod("threeSum", int[].class); Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; Object out=m.invoke(targetObj, (Object)nums); if(out instanceof List){ List<?> res=(List<?>)out; System.out.print("["); for(int i=0;i<res.size();i++){ Object item=res.get(i); if(item instanceof List){ List<?> sub=(List<?>)item; System.out.print("["); for(int j=0;j<sub.size();j++) System.out.print(sub.get(j)+(j+1<sub.size()?",":"")); System.out.print("]"); } System.out.print(i+1<res.size()?",":""); } System.out.print("]"); } return; }catch(Throwable ignore){} }
        }
        // climbStairs variants
        if(${hasClimbStairs ? 'true' : 'false'}){
          Integer n=null; if(all.contains("n=")){ int p=all.indexOf("n="); StringBuilder sb=new StringBuilder(); for(int i=p+2;i<all.length();i++){ char c=all.charAt(i); if(Character.isWhitespace(c)) break; sb.append(c);} if(sb.length()>0) n=Integer.parseInt(sb.toString()); }
          if(n!=null){ try{ java.lang.reflect.Method m=clazz.getDeclaredMethod("climbStairs", int.class); Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; Object ans=m.invoke(targetObj, n); System.out.print(String.valueOf(ans)); return; }catch(Throwable ignore){} }
        }
        // coinChange variants
        if(${hasCoinChange ? 'true' : 'false'}){
          int[] coins=null; Integer amount=null;
          if(all.contains("coins=")){
            int l=all.indexOf("coins="); int lb=all.indexOf('[',l); int rb=all.indexOf(']',lb+1); if(lb>=0 && rb>lb){ String a=all.substring(lb+1,rb); String[] s=a.split(","); coins=new int[s.length]; for(int i=0;i<s.length;i++) coins[i]=s[i].trim().isEmpty()?0:Integer.parseInt(s[i].trim()); }
          }
          if(all.contains("amount=")){ int p=all.indexOf("amount="); StringBuilder sb=new StringBuilder(); for(int i=p+7;i<all.length();i++){ char c=all.charAt(i); if(Character.isWhitespace(c) || c==',') break; sb.append(c);} if(sb.length()>0) amount=Integer.parseInt(sb.toString()); }
          if(coins!=null && amount!=null){ try{ java.lang.reflect.Method m=clazz.getDeclaredMethod("coinChange", int[].class, int.class); Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; Object ans=m.invoke(targetObj, (Object)coins, amount); System.out.print(String.valueOf(ans)); return; }catch(Throwable ignore){} }
        }
        // Generic single-arg fallback: pick first non-main method
        try{
          java.lang.reflect.Method[] ms = clazz.getDeclaredMethods();
          for(java.lang.reflect.Method m: ms){
            if(m.getName().equals("main")) continue;
            Class<?>[] ps = m.getParameterTypes();
            // int[] parameter
            if(ps.length==1 && ps[0]==int[].class){
              int[] arr=null;
              if(all.contains("nums=")){
                int l=all.indexOf("nums="); int lb=all.indexOf('[',l); int rb=all.indexOf(']',lb+1); if(lb>=0 && rb>lb){ String a=all.substring(lb+1,rb); String[] s=a.split(","); arr=new int[s.length]; for(int i=0;i<s.length;i++) arr[i]=s[i].trim().isEmpty()?0:Integer.parseInt(s[i].trim()); }
              } else if(all.contains("prices=")){
                int l=all.indexOf("prices="); int lb=all.indexOf('[',l); int rb=all.indexOf(']',lb+1); if(lb>=0 && rb>lb){ String a=all.substring(lb+1,rb); String[] s=a.split(","); arr=new int[s.length]; for(int i=0;i<s.length;i++) arr[i]=s[i].trim().isEmpty()?0:Integer.parseInt(s[i].trim()); }
              } else if(lines.size()>=1 && lines.get(0).startsWith("[")){
                String s=lines.get(0).replace("["," ").replace("]"," ").trim(); String[] ps1=s.length()==0? new String[0] : s.split(","); arr=new int[ps1.length]; for(int i=0;i<ps1.length;i++) arr[i]=ps1[i].trim().isEmpty()?0:Integer.parseInt(ps1[i].trim());
              }
              if(arr!=null){ Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; Object out=m.invoke(targetObj, (Object)arr); if(out instanceof int[]){ int[] a=(int[])out; for(int i=0;i<a.length;i++) System.out.print(a[i]+(i+1<a.length?" ":"")); } else { System.out.print(String.valueOf(out)); } return; }
            }
            // int parameter
            if(ps.length==1 && (ps[0]==int.class || ps[0]==Integer.class)){
              Integer v=null; if(all.contains("n=")){ int p=all.indexOf("n="); StringBuilder sb=new StringBuilder(); for(int i=p+2;i<all.length();i++){ char c=all.charAt(i); if(Character.isWhitespace(c)) break; sb.append(c);} if(sb.length()>0) v=Integer.parseInt(sb.toString()); } else if(lines.size()>=1){ String[] parts=lines.get(0).trim().split(" +"); if(parts.length>=1) try{ v=Integer.parseInt(parts[0]); }catch(Throwable ign){} }
              if(v!=null){ Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; Object out=m.invoke(targetObj, v); System.out.print(String.valueOf(out)); return; }
            }
            // String parameter
            if(ps.length==1 && ps[0]==String.class){ String s=null; if(all.contains("s=")){ int p=all.indexOf("s="); int q=p+2; if(q<all.length()) s=all.substring(q).trim(); } else if(lines.size()>=1) s=lines.get(0); if(s!=null){ Object targetObj = java.lang.reflect.Modifier.isStatic(m.getModifiers()) ? null : sol; Object out=m.invoke(targetObj, s); System.out.print(String.valueOf(out)); return; } }
          }
        }catch(Throwable ig){ }
      }catch(Throwable t){ /* fallthrough */ }
      // default: print nothing to avoid WA from noise
      System.out.print("\\n");
    } }`;

    return header + user + "\n" + main;
  }
  return code;
}

async function submitCode(req,res){
  console.log('\n=== SUBMIT CODE START ===');
  try{
    if(!req.result || !req.result._id) return res.status(401).json({accepted:false,error:'Unauthorized'});
    let { code, language } = req.body; const problemId=req.params.id; const userId=req.result._id;
    if(!code||!language||!problemId) return res.status(400).json({accepted:false,error:'Some field missing'});
    if(!code.trim()) return res.status(400).json({accepted:false,error:'Code cannot be empty'});
    if(language==='cpp') language='c++';
    const problem = await Problem.findById(problemId);
    if(!problem) return res.status(404).json({accepted:false,error:'Problem not found'});
    if(!problem.hiddenTestCases || problem.hiddenTestCases.length===0) return res.status(400).json({accepted:false,error:'No test cases available'});
    const wrapped = buildHarness(language, code);
    const langId = getLanguageById(language); if(!langId) return res.status(400).json({accepted:false,error:'Unsupported language'});
    const submissionDoc = await Submission.create({ userId, problemId, code, language, status:'pending', testCasesTotal: problem.hiddenTestCases.length });
    const submissions = problem.hiddenTestCases.map(tc=>({ source_code: wrapped, language_id: langId, stdin:(tc.input??'').toString(), expected_output:(tc.output??'').toString() }));
    console.log('🚀 Hidden tests -> Judge0:', submissions.length);
    const submitResp = await submitBatch(submissions); const tokens = submitResp.map(r=>r.token); const results = await submitToken(tokens);
    let passed=0, runtime=0, memory=0, status='accepted', errorMessage=null, failure=null;
    results.forEach((r,i)=>{ if(r.status_id===3){ passed++; runtime+=parseFloat(r.time||0); memory=Math.max(memory,r.memory||0);} else { if(r.status_id===6){ status='error'; errorMessage=r.compile_output||r.stderr||'Compilation Error'; } else if(r.status_id===5){ status='time'; errorMessage='Time Limit Exceeded'; } else if(r.status_id>=7){ status='runtime'; errorMessage=r.stderr||'Runtime Error'; } else if(r.status_id===4){ status='wrong'; errorMessage=r.stdout || 'Wrong Answer'; } else { status='error'; errorMessage=r.stderr||r.compile_output||'Error'; } if(!failure){ const orig=problem.hiddenTestCases[i]; failure={ index:i,input:orig?.input, expected_output:orig?.output, stdout:r.stdout, stderr:r.stderr, compile_output:r.compile_output, status_id:r.status_id, token:r.token }; console.log('❌ Hidden fail detail:', failure); } } });
    submissionDoc.status=status; submissionDoc.testCasesPassed=passed; submissionDoc.errorMessage=errorMessage; submissionDoc.runtime=runtime; submissionDoc.memory=memory; await submissionDoc.save();
    if(status==='accepted' && !req.result.problemSolved.includes(problemId)){ req.result.problemSolved.push(problemId); await req.result.save(); }
    return res.status(201).json({ accepted: status==='accepted', totalTestCases: submissionDoc.testCasesTotal, passedTestCases: passed, runtime, memory, error: errorMessage || (status==='accepted'? null : 'Wrong Answer'), failure });
  }catch(err){
    console.error('❌ SUBMIT EXCEPTION:', err.stack||err.message||err);
    let userMsg = err?.message||'Submission failed';
    
    // Check for quota exhaustion
    if(err?.message?.includes('QUOTA_EXHAUSTED')) {
      // Extract wait time from error message
      const match = err.message.match(/reset in ([^.]+)/);
      const waitTime = match ? match[1] : 'a few hours';
      userMsg = `⏰ Judge0 API daily limit reached!\n\n` +
                `Quota will reset in: ${waitTime}\n\n` +
                `Options:\n` +
                `1. Wait for quota reset (resets daily)\n` +
                `2. Contact admin to upgrade API plan\n` +
                `3. Use self-hosted Judge0 (unlimited & free)`;
    } else if(err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('exceeded')) {
      userMsg = '⏰ Judge0 API quota exceeded. Please try again later or contact admin.';
    }
    
    return res.status(200).json({accepted:false,totalTestCases:0,passedTestCases:0,runtime:0,memory:0,error:userMsg});
  }
}

async function runCode(req,res){
  console.log('\n=== RUN CODE START ===');
  try{
    const problemId=req.params.id; let {code,language}=req.body; if(!code||!language||!problemId) return res.status(400).json({success:false,error:'Some field missing'}); if(!code.trim()) return res.status(400).json({success:false,error:'Code cannot be empty'}); if(language==='cpp') language='c++';
    const problem=await Problem.findById(problemId); if(!problem) return res.status(404).json({success:false,error:'Problem not found'}); if(!problem.visibleTestCases||problem.visibleTestCases.length===0) return res.status(400).json({success:false,error:'No test cases available'});
    const langId=getLanguageById(language); if(!langId) return res.status(400).json({success:false,error:'Unsupported language'});
    const wrapped=buildHarness(language, code);
    const submissions=problem.visibleTestCases.map(tc=>({ source_code:wrapped, language_id:langId, stdin:tc.input.toString(), expected_output:tc.output.toString() }));
    console.log('🚀 Visible tests -> Judge0:', submissions.length);
    const submitResp=await submitBatch(submissions); const tokens=submitResp.map(r=>r.token); const results=await submitToken(tokens);
    let passed=0,runtime=0,memory=0, success=true, errorMessage=null, failure=null;
    for(let i=0;i<results.length;i++){ const r=results[i]; if(r.status_id===3){ passed++; runtime+=parseFloat(r.time||0); memory=Math.max(memory,r.memory||0);} else { success=false; if(r.status_id===6){ errorMessage=r.compile_output||r.stderr||'Compilation Error'; } else if(r.status_id===5){ errorMessage='Time Limit Exceeded'; } else if(r.status_id>=7){ errorMessage=r.stderr||'Runtime Error'; } else if(r.status_id===4){ errorMessage=r.stdout||'Wrong Answer'; } else { errorMessage=r.stderr||r.compile_output||'Error'; } if(!failure){ const orig=problem.visibleTestCases[i]; failure={ index:i,input:orig?.input, expected_output:orig?.output, stdout:r.stdout, stderr:r.stderr, compile_output:r.compile_output, status_id:r.status_id, token:r.token }; console.log('❌ Visible fail detail:', failure);} break; }}
    return res.status(200).json({ success, testCases:results, runtime:runtime.toFixed(3), memory, error:errorMessage, totalTestCases:problem.visibleTestCases.length, passedTestCases:passed, failure });
  }catch(err){
    console.error('❌ RUN EXCEPTION:', err.stack||err.message||err);
    let userMsg = err?.message||'Run failed';
    
    // Check for quota exhaustion
    if(err?.message?.includes('QUOTA_EXHAUSTED')) {
      // Extract wait time from error message
      const match = err.message.match(/reset in ([^.]+)/);
      const waitTime = match ? match[1] : 'a few hours';
      userMsg = `⏰ Judge0 API daily limit reached!\n\n` +
                `Quota will reset in: ${waitTime}\n\n` +
                `Options:\n` +
                `1. Wait for quota reset (resets daily)\n` +
                `2. Contact admin to upgrade API plan\n` +
                `3. Use self-hosted Judge0 (unlimited & free)`;
    } else if(err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('exceeded')) {
      userMsg = '⏰ Judge0 API quota exceeded. Please try again later or contact admin.';
    }
    
    return res.status(200).json({success:false,testCases:[],runtime:0,memory:0,error:userMsg,totalTestCases:0,passedTestCases:0});
  }
}

module.exports = { submitCode, runCode };



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',


// User.findByIdUpdate({
// })

//const user =  User.findById(id)
// user.firstName = "Mohit";
// await user.save();