import { Request, Response } from 'express';
import { query, queryOne } from '../../database/connection';
import { successResponse } from '../../middleware/errorHandler';
import type { CompanyCommunication } from '@rewa-bhoomi/types';

export const getCompanyCommunication = async (req: Request, res: Response) => {
  let settings = await queryOne<CompanyCommunication>(
    `SELECT * FROM company_communications WHERE id = 'default'`
  );

  if (!settings) {
    const rows = await query<CompanyCommunication>(
      `INSERT INTO company_communications (id) VALUES ('default') RETURNING *`
    );
    settings = rows[0];
  }

  return successResponse(res, settings);
};

export const updateCompanyCommunication = async (req: Request, res: Response) => {
  const {
    whatsapp_number,
    whatsapp_message,
    instagram_url,
    twitter_url,
    youtube_url,
    facebook_url,
    linkedin_url,
    contact_phone,
    contact_email,
    office_address,
  } = req.body;

  const rows = await query<CompanyCommunication>(
    `INSERT INTO company_communications (
       id, whatsapp_number, whatsapp_message, instagram_url, twitter_url,
       youtube_url, facebook_url, linkedin_url, contact_phone, contact_email,
       office_address, updated_at
     ) VALUES (
       'default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
     )
     ON CONFLICT (id) DO UPDATE SET
       whatsapp_number = EXCLUDED.whatsapp_number,
       whatsapp_message = EXCLUDED.whatsapp_message,
       instagram_url = EXCLUDED.instagram_url,
       twitter_url = EXCLUDED.twitter_url,
       youtube_url = EXCLUDED.youtube_url,
       facebook_url = EXCLUDED.facebook_url,
       linkedin_url = EXCLUDED.linkedin_url,
       contact_phone = EXCLUDED.contact_phone,
       contact_email = EXCLUDED.contact_email,
       office_address = EXCLUDED.office_address,
       updated_at = NOW()
     RETURNING *`,
    [
      whatsapp_number ?? null,
      whatsapp_message ?? null,
      instagram_url ?? null,
      twitter_url ?? null,
      youtube_url ?? null,
      facebook_url ?? null,
      linkedin_url ?? null,
      contact_phone ?? null,
      contact_email ?? null,
      office_address ?? null,
    ]
  );

  return successResponse(res, rows[0], 'Communication settings updated successfully');
};
