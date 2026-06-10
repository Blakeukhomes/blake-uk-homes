-- Add ICO Registration as a 6th compliance type.
-- ICO (Information Commissioner's Office) registration is required for any UK
-- landlord that processes tenant personal data — which is effectively all of them.
-- Annual renewal, ~£40/year, ZA-format registration number.

alter type public.compliance_type add value if not exists 'ico_registration';
alter type public.document_kind   add value if not exists 'ico_registration';

-- Refresh the expiry helper so ICO defaults to +1 year.
create or replace function public.compliance_expiry(c_type public.compliance_type, completed date)
returns date language sql immutable as $$
  select case c_type
    when 'gas_safety'          then completed + interval '1 year'
    when 'eicr'                then completed + interval '5 years'
    when 'epc'                 then completed + interval '10 years'
    when 'buildings_insurance' then completed + interval '1 year'
    when 'legionella'          then completed + interval '2 years'
    when 'ico_registration'    then completed + interval '1 year'
  end::date;
$$;
