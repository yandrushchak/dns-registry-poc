import { List, Datagrid, TextField, UrlField } from 'react-admin';

export const DNSRecordsList = () => (
  <List title="DNS Records">
    <Datagrid>
      <TextField source="id" label="Token Id" />
      <UrlField source="domain" />
      <TextField source="web3Address" />
      <TextField source="dnsRecords" />
    </Datagrid>
  </List>
);
