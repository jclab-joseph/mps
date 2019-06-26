/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Description: Handler to get amt device event logs
**********************************************************************/

import {Response, Request} from 'express'
import { logger as log } from "../../utils/logger";
import { IAmtHandler } from "../../models/IAmtHandler";
import { mpsMicroservice } from "../../mpsMicroservice";

import { wscomm, wsman, amt} from "../../utils/constants";
import { ErrorResponse } from "../../utils/amtHelper";

export class EventLogHandler implements IAmtHandler {
  
  mpsService: mpsMicroservice;
  name: string;

  constructor(mpsService: mpsMicroservice) {
      this.name="EventLog";
      this.mpsService =mpsService;
  }

  async AmtAction(req: Request, res: Response){
    try{
        let payload = req.body.payload;  
        if(payload.guid){
          let ciraconn = this.mpsService.mpsserver.ciraConnections[payload.guid];
          if(ciraconn && ciraconn.readyState == 'open'){
            var cred = await this.mpsService.db.getAmtPassword(payload.guid);
            var wsstack = new wsman(wscomm, payload.guid, 16992, cred[0], cred[1], 0, this.mpsService);
            var amtstack = new amt(wsstack);
            amtstack.GetMessageLog(function (stack, responses, tag, status) {
                if (status == 200) {
                  return res.send(responses);  
                }else{
                  log.error(`Failed during GET MessageLog guid : ${payload.guid}.`);
                  return res.status(status).send(ErrorResponse(status, `Failed during GET MessageLog guid : ${payload.guid}.`));
                }        
            });
          }else{
            res.set({ 'Content-Type': 'application/json' });
            return res.status(404).send(ErrorResponse(404, `guid : ${payload.guid}`, 'device'));
          }            
        }else{
            res.set({ 'Content-Type': 'application/json' });
            return res.status(404).send(ErrorResponse(404, null, 'guid'));
        }
  
      }catch(error){
         log.error(`Exception in AMT EventLog: ${error}`);
         return res.status(500).send(ErrorResponse(500, 'Request failed during AMT EventLog.'));
      }
  }

}