const discord = require('discord.js');
const fs = require('fs');
const http = require('http');
const db = require('quick.db');
const moment = require('moment')
const express = require('express');
const ayarlar = require('./ayarlar.json');
const app = express();
app.get("/", (request, response) => {
response.sendStatus(200);
});
app.listen(process.env.PORT);


//READY.JS

const Discord = require('discord.js');
const client = new Discord.Client();
client.on('ready', async () => {
   client.appInfo = await client.fetchApplication();
  setInterval( async () => {
    client.appInfo = await client.fetchApplication();
  }, 600);
  
 client.user.setActivity(`Lrows Youtube`, { type:'WATCHING' })
  
  console.log("Lrows V12 Altyapı Aktif")
});

const log = message => {
  console.log(` ${message}`);
};
require('./util/eventLoader.js')(client);

//READY.JS SON

//KOMUT ALGILAYICI

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
    if (err) console.error(err);
    log(`${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./komutlar/${f}`);
        log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});




client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
           reject(e);
        }
    });
};

client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./komutlar/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};




client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

//KOMUT ALGILAYICI SON

client.elevation = message => {
    if (!message.guild) {
        return;
    }
    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (message.author.id === ayarlar.sahip) permlvl = 4;
    return permlvl;
};
client.login(process.env.TOKEN)

//botu sese sokma// -Lrows
  client.on("ready", () =>{
client.channels.cache.get('811981742147240017').join()
})
//afk main// - Lrows
function afkSil(message, afk, isim) {
  message.channel.send(`${message.author} Artık **AFK** değilsiniz.`);
  db.delete(`afkSebep_${afk.id}_${message.guild.id}`)
  db.delete(`afkid_${afk.id}_${message.guild.id}`)
  db.delete(`afkAd_${afk.id}_${message.guild.id}`)
  db.delete(`afk_süre_${afk.id}_${message.guild.id}`)
  message.member.setNickname(isim)
};

client.on("message" , async message => {
  if (message.author.bot) return;
  if (!message.guild) return;
  var fd = false
  var sdd = new Set();
  let afk = message.mentions.users
  if (afk.first()) {
    afk.forEach(async afk => {
      if (sdd.has(afk.id)) return;
      else sdd.add(afk.id)
      var kisi = db.fetch(`afkid_${afk.id}_${message.guild.id}`)
      var kisi2 = db.fetch(`afkid_${message.member.id}_${message.guild.id}`)
      if (kisi) {
        var isim = db.fetch(`afkAd_${afk.id}_${message.guild.id}`)
        if (kisi2) {
          fd = true
          afkSil(message, message.member, isim)
        }
        if (afk.id == message.member.id) {
          if (!fd) afkSil(message, afk, isim)
        }
        if (afk.id !== message.member.id) {
          var sebep = db.fetch(`afkSebep_${afk.id}_${message.guild.id}`)
          if (sebep) {
            let süre = await db.fetch(`afk_süre_${afk.id}_${message.guild.id}`);
            let timeObj = ms(Date.now() - süre);
            message.channel.send(`${afk} şu an da AFK!
Şu kadar süredir: ${timeObj.days} Gün, ${timeObj.hours} Saat, ${timeObj.minutes} Dakika, ${timeObj.seconds} Saniye
Sebep: ${sebep}`);
          };
        }
      } else {
        afk = message.member
        kisi = db.fetch(`afkid_${message.member.id}_${message.guild.id}`)
        if (kisi) {
          var isim = db.fetch(`afkAd_${afk.id}_${message.guild.id}`)
          if (afk.id == message.member.id) {
            afkSil(message, afk, isim)
          }
          if (afk.id !== message.member.id) {
            var sebep = db.fetch(`afkSebep_${afk.id}_${message.guild.id}`)
            if (message.content.includes(kisi)) {
              if (sebep) {
                let süre = await db.fetch(`afk_süre_${afk.id}_${message.guild.id}`);
                let timeObj = ms(Date.now() - süre);
                message.channel.send(`${afk} şu an da AFK!
Şu kadar süredir: ${timeObj.days} Gün, ${timeObj.hours} Saat, ${timeObj.minutes} Dakika, ${timeObj.seconds} Saniye
Sebep: ${sebep}`);
              };
            }
          }
        }
      }
    })
  } else {
    afk = message.member
    var kisi = db.fetch(`afkid_${afk.id}_${message.guild.id}`)
    if (!kisi) return;
    var isim = db.fetch(`afkAd_${afk.id}_${message.guild.id}`)
    afkSil(message, afk, isim)
  }
});

