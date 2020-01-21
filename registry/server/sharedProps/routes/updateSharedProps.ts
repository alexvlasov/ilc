import {
    Request,
    Response,
} from 'express';
import Joi from '@hapi/joi';
import _ from 'lodash/fp';

import db from '../../db';
import validateRequestFactory from '../../common/services/validateRequest';
import preProcessResponse from '../../common/services/preProcessResponse';
import { stringifyJSON } from '../../common/services/json';
import SharedProps, {
    sharedPropsNameSchema,
    partialSharedPropsSchema,
} from '../interfaces';

type RequestParams = {
    name: string
};

const validateRequest = validateRequestFactory([
    {
        schema: Joi.object({
            name: sharedPropsNameSchema.required(),
        }),
        selector: _.get('params'),
    },
    {
        schema: partialSharedPropsSchema,
        selector: _.get('body')
    },
]);

const updateSharedProps = async (req: Request<RequestParams>, res: Response): Promise<void> => {
    const sharedProps = req.body;
    const sharedPropsName = req.params.name;

    const countToUpdate = await db('shared_props').where({ name: sharedPropsName })
    if (!countToUpdate.length) {
        res.status(404).send('Not found');
        return;
    }

    await db('shared_props').where({ name: sharedPropsName }).update(stringifyJSON(['props'], sharedProps));
    const [updatedSharedProps] = await db.select().from<SharedProps>('shared_props').where('name', sharedPropsName);

    res.status(200).send(preProcessResponse(updatedSharedProps));
};

export default [validateRequest, updateSharedProps];
