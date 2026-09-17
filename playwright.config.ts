import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',timeout:420000,workers:1,use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1280,height:800},headless:true,launchOptions:{args:['--enable-webgl','--enable-unsafe-swiftshader']}},reporter:[['list'],['html',{open:'never'}]]});
