const ping = require('ping');

// custom modules
const hostModule = require('./host.module');

let statusList = [];
let newStatusList = [];

module.exports = {
    sendPing: async (hosts) => {
        let primaryHostId = hosts[0].id;
        

        hosts.forEach(async (element) => {
            try {
                let hostStatus = {};
                
                let res = await getPing(element['address']);
                hostStatus['id'] = element['id'];
                hostStatus['measurementTime'] = (new Date()).toLocaleTimeString();
                
                if (res.alive === true) {
                    hostStatus['isAlive'] = true;
                    hostStatus['time'] = res.time;                    
    
                    // for primary host chart
                    if (element['id'] === primaryHostId) {
                        let phData = {
                            "time": res.time,
                            "measurementTime": (new Date()).toLocaleTimeString()
                        }
                        hostModule.addPrimaryHostStatus(phData);
                    } 
                }
                else{
                    hostStatus['isAlive'] = false;
                    hostStatus['time'] = 0;
    
                    // for primary host chart
                    if (element['id'] === primaryHostId) {
                        let phData = {
                            "time": 0,
                            "measurementTime": (new Date()).toLocaleTimeString()
                        }
                        hostModule.addPrimaryHostStatus(phData);
                    } 
                }   
                
                statusList.push(hostStatus);                
        
            } catch (error) {
                console.log(`Ping modul error: ${error}`)
            }
        }); // foreach end
        
        newStatusList = statusList;
        statusList = [];
        return newStatusList;
    }
};

const getPing = async (host) => {
    let res = ping.promise.probe(host, {timeout: 2});
    return res;
}

