'use client'
import { useState } from 'react'
import { Input, Label, Select } from '@/components/ui/input'
import { AddressAutocomplete, type AddressSelection } from './address-autocomplete'

export function AddressFields({
  defaultLine1 = '',
  defaultLine2 = '',
  defaultCity = '',
  defaultPostcode = '',
  defaultCountry = 'United Kingdom',
}: {
  defaultLine1?: string
  defaultLine2?: string
  defaultCity?: string
  defaultPostcode?: string
  defaultCountry?: string
}) {
  const [line1, setLine1] = useState(defaultLine1)
  const [line2, setLine2] = useState(defaultLine2)
  const [city, setCity] = useState(defaultCity)
  const [postcode, setPostcode] = useState(defaultPostcode)
  const [country, setCountry] = useState(defaultCountry)

  function onPick(addr: AddressSelection) {
    setLine1(addr.address_line_1)
    setLine2(addr.address_line_2 ?? '')
    setCity(addr.city)
    setPostcode(addr.postcode)
    setCountry(addr.country || 'United Kingdom')
  }

  return (
    <>
      <div className="sm:col-span-2">
        <Label>Find your address (search)</Label>
        <AddressAutocomplete onSelect={onPick} />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="address_line_1">Address line 1 *</Label>
        <Input id="address_line_1" name="address_line_1" required value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="e.g. 1 Example Road" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="address_line_2">Address line 2</Label>
        <Input id="address_line_2" name="address_line_2" value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Apartment, suite, etc." />
      </div>
      <div>
        <Label htmlFor="city">City *</Label>
        <Input id="city" name="city" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" />
      </div>
      <div>
        <Label htmlFor="postcode">Postcode *</Label>
        <Input id="postcode" name="postcode" required value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SW1A 1AA" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="country">Country</Label>
        <Select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Ireland">Ireland</option>
          <option value="Other">Other</option>
        </Select>
      </div>
    </>
  )
}
