   1                         // Update Analogue Clock Hands
   2                         const seconds = now.getSeconds();
   3                         const minutes = now.getMinutes();
   4                         const hours = now.getHours();
   5                         document.getElementById('sec-hand').style.setProperty('--rotation', (seconds / 60) * 360);
   6                         document.getElementById('min-hand').style.setProperty('--rotation', (minutes / 60) * 360 + (seconds / 60) * 6);
   7                         document.getElementById('hour-hand').style.setProperty('--rotation', (hours / 12) * 360 + (minutes / 60) * 30);
