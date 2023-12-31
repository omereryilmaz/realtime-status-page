const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let primaryHostStatus = [];

module.exports = {
    getHosts: async () => {
        let hosts = [];
    
        try {
            const rawData = fs.readFileSync("hosts.txt", "utf-8");
            if (rawData.length > 0) {
                const line = rawData.split('\r\n').map(line => line.trim());
            
                line.forEach(element => {
                    let host = {};
                    let i = element.split('=');
                    host['id'] = uuidv4().split('-')[0];
                    host['name'] = textControl(i[0]);
                    host['address']= sanitizeForLink(i[1].trim());
                    hosts.push(host);
                });
            }        
            //console.log(hosts);
        } catch (error) {
            console.error("Error reading file:", error);
        }
    
        return hosts;
    },
    fillZeroPrimaryHSA: async () => {
        // fill zero to primary host status array for begin
        for (let i = 0; i < 11; i++) {
            let zeroData = {
                "time": 0,
                "measurementTime": 0
            }
            primaryHostStatus.push(zeroData);
        }
      
    },
    addPrimaryHostStatus: (data) => {
        // for chart
        primaryHostStatus.shift();
        let newData = {
            "time": data.time,
            "measurementTime": data.measurementTime
        }
        primaryHostStatus.push(newData);
        
    },
    getPrimaryHostStatus: async () => {
        return primaryHostStatus;
    }
}

const textControl =  (str) => {
    let newStr = str;
    if (str.length > 25) {
        newStr = str.substring(0, 26) + '...';
    }

    return sanitize(newStr);
}

const sanitize = (str) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return str.replace(reg, (match)=>(map[match]));
}

const sanitizeForLink = (str) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    };
    const reg = /[&<>"']/ig;
    return str.replace(reg, (match)=>(map[match]));
}