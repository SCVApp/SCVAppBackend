import "isomorphic-fetch"
import { Client, ResponseType } from "@microsoft/microsoft-graph-client";
import { Injectable } from "@nestjs/common";
import { readFile } from "fs/promises";

@Injectable()
export class UserService{
    getClient(accessToken){
        const client = Client.init({
            defaultVersion:"v1.0",
            debugLogging:true,
            authProvider: (done) => {
                done(null, accessToken)
            }
        });
        return client
    }

    dobiUroIzUrnika($razred){
        let ucitelj = ""
            let d = $razred.find(".text11").get()[0]
            if(d){
                if(d.attribs){
                    ucitelj = d.attribs.title
                }
            }

            let JeDogodk = $razred.find(".ednevnik-seznam_ur_teden-td-dogodek").text() !== ""
            
            if(JeDogodk){
                return{
                    krajsava:"",
                    ucilnicaInUcitelj:"",
                    ucitelj:"",
                    ucilnica:"",
                    dogodek:$razred.find(".text14").text().trim()||"",
                    nadomescanje:false,
                    zaposlitev:false,
                    odpadlo:false
                }
            }


            let jeNadmomescanje = $razred.find(".ednevnik-seznam_ur_teden-td-nadomescanje").text() !== ""
            let jeZaposlitev = $razred.find(".ednevnik-seznam_ur_teden-td-zaposlitev").text() !== ""
            let jeOdpadlo = $razred.find(".ednevnik-seznam_ur_teden-td-odpadlo").text() !== ""

            if($razred.get()[0]){
                if($razred.get()[0].attribs){
                    let ura = $razred.get()[0].attribs.class
                    if(ura){
                        if(!jeNadmomescanje){
                            jeNadmomescanje = ura.includes("ednevnik-seznam_ur_teden-td-nadomescanje")
                        }
                        if(!jeZaposlitev){
                            jeZaposlitev = ura.includes("ednevnik-seznam_ur_teden-td-zaposlitev")
                        }
                        if(!jeOdpadlo){
                            jeOdpadlo = ura.includes("ednevnik-seznam_ur_teden-td-odpadlo")
                        }
                    }
                }
            }
            let ucilnicaInUcitelj = $razred.find(".text11").text().trim()||""
            let ucilnica = this.pocistiImeZaUcilnico(ucilnicaInUcitelj.slice(ucilnicaInUcitelj.indexOf(", ")+1).trim())

            return{
                krajsava:$razred.find("span").text()||"",
                ucilnicaInUcitelj:ucilnicaInUcitelj,
                ucitelj:ucitelj,
                ucilnica:ucilnica||"",
                dogodek:"",
                nadomescanje:jeNadmomescanje,
                zaposlitev:jeZaposlitev,
                odpadlo:jeOdpadlo
            }
    }

    kajJeSedejNaUrniku(urnik){
        for(let i = 0;i<urnik.length;i++){
            let ura = urnik[i]
            let trajanje = ura.trajanje.split("-")
            let zacetek = trajanje[0].trim().split(":")
            let konec = trajanje[1].trim().split(":")
            
            let trenutniCas = new Date()

            let zacetniCas = new Date(trenutniCas.getTime())
            zacetniCas.setHours(zacetek[0]);
            zacetniCas.setMinutes(zacetek[1]);
            zacetniCas.setSeconds(0);

            if(trenutniCas<zacetniCas){
                return{
                    id:-1,
                    ime:"/",
                    trajanje:"/",
                    ura:[],
                    naslednjaUra:this.dobiNaslednjoUro(urnik,i-1,trenutniCas)
                }
            }

            let koncniCas = new Date(trenutniCas.getTime())
            koncniCas.setHours(konec[0]);
            koncniCas.setMinutes(konec[1]);
            koncniCas.setSeconds(0);
            
            let jeMedDvemaCasoma = zacetniCas <= trenutniCas && koncniCas >= trenutniCas
            if(jeMedDvemaCasoma){
                ura.naslednjaUra = this.dobiNaslednjoUro(urnik,i,trenutniCas)
                return ura
            }
        }
        return{
            id:-1,
            ime:"/",
            trajanje:"/",
            ura:[]
        }
    }

    dobiNaslednjoUro(urnik,atIndex,trenutniCas){
        if(urnik.length<atIndex+2){
            return{
                id:-1,
                ime:"/",
                trajanje:"/",
                ura:[],
                doUre:"/"
            }
        }
        let ura = urnik[atIndex+1]
        let trajanje = ura.trajanje.split("-")
        let zacetek = trajanje[0].trim().split(":")

        let zacetniCas = new Date(trenutniCas.getTime())
        zacetniCas.setHours(zacetek[0]);
        zacetniCas.setMinutes(zacetek[1]);
        zacetniCas.setSeconds(0);

        let difference = zacetniCas.getTime() - trenutniCas.getTime();
        let differencString = this.izMillisekundVMinuteinSekunde(difference)
        if(ura.ura.length==0){
            ura.doUre="/"
        }else{
            ura.doUre = differencString
        }
        return ura
    }

    izMillisekundVMinuteinSekunde(millis) {
        let minutes = Math.floor(millis / 60000)
        let seconds = (millis % 60000) / 1000
        return minutes + "min " + (seconds < 10 ? '0' : '') + seconds + "s"
    }

    async getUsersSchool(client){
        const data = await client.api("/me/memberOf?$select=groupTypes,mailEnabled,securityEnabled,displayName").responseType(ResponseType.JSON).get()


        let razred = data.value.find(e=>e.mailEnabled == true && e.securityEnabled == true && e.groupTypes.length == 0) || ""

        let SchoolInfoText = (await readFile(`${process.cwd()}/src/schoolData/schoolInfo.json`)).toString()
        let SchoolsInfo = JSON.parse(SchoolInfoText).schools
        
        let selectedSchool = {
            id:"SCV",
            urnikUrl:"https://www.easistent.com/",
            color:"#FFFFFF",
            schoolUrl:"https://www.scv.si/sl/",
            name:"Šolski center Velenje",
            razred:""
        }

        let eASchoolsLinksText = (await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)).toString()
        let eASchoolsLinks = JSON.parse(eASchoolsLinksText).schools


        eASchoolsLinks.forEach(school => {
            let classes = Object.keys(school.classes)
            if(classes.includes(razred.displayName)){
                let id = school.classes[razred.displayName]
                selectedSchool.id = school.id
                selectedSchool.urnikUrl = `${school.mainLink}${id}`
                selectedSchool.razred = razred.displayName
            }else{
                let idSole = data.value.find(e=>e.mailEnabled == false && e.securityEnabled == true && e.groupTypes.length == 0 && Object.keys(SchoolsInfo).includes(e.displayName))
                if(idSole){
                    selectedSchool.id = idSole.displayName
                }
            }
        });

        if(Object.keys(SchoolsInfo).includes(selectedSchool.id)){
            let schoolInfo = SchoolsInfo[selectedSchool.id]
            selectedSchool.color = schoolInfo.color
            selectedSchool.schoolUrl = schoolInfo.urlStrani
            selectedSchool.name = schoolInfo.name
        }

        return selectedSchool
    }

    pocistiImeZaUcilnico(ucilina){
        let index = ucilina.indexOf("  ")
        if(index<0) return ucilina
        return ucilina.slice(0,index)
    }
}