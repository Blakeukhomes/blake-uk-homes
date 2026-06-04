-- Add legionella to the document_kind enum so legionella risk assessments can be uploaded as their own type.
alter type public.document_kind add value if not exists 'legionella';
