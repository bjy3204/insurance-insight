import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { CrmError, seal, unseal, type Connection } from './server';
import type { GoogleConnection } from './sheets';
type Provider = 'notion' | 'sheets';
type Stored = Connection | GoogleConnection;
function database() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth:{persistSession:false,autoRefreshToken:false}}); }
function storageError() { return new CrmError('회원 연결 정보를 저장하지 못했습니다 운영자가 고객관리 연결 SQL 설정을 확인해 주세요',503); }
export async function saveConnection(provider:Provider, connection:Stored) {
 if (!connection.owner) throw new CrmError('다시 로그인해 주세요',401);
 const saved={...connection,expires:Date.now()+10*365*86400000};
 const {error}=await database().from('crm_storage_connections').upsert({user_id:connection.owner,provider,encrypted_connection:seal(saved),updated_at:new Date().toISOString()},{onConflict:'user_id,provider'});
 if(error) throw storageError();
}
export async function loadConnection<T extends Stored>(provider:Provider,owner:string,request:NextRequest,cookie:string):Promise<T> {
 const {data,error}=await database().from('crm_storage_connections').select('encrypted_connection').eq('user_id',owner).eq('provider',provider).maybeSingle();
 if(error) throw storageError();
 if(data) { const connection=unseal<T>(data.encrypted_connection);if((provider==='sheets'&&(!('provider' in connection)||connection.provider!=='sheets'))||(provider==='notion'&&'provider' in connection))throw new CrmError('저장소에 다시 연결해 주세요',401);if(connection.owner!==owner)throw new CrmError('저장소에 다시 연결해 주세요',401);return connection; }
 const connection=unseal<T>(request.cookies.get(cookie)?.value||'');
 if(connection.owner!==owner||(provider==='sheets'&&(!('provider' in connection)||connection.provider!=='sheets'))||(provider==='notion'&&'provider' in connection))throw new CrmError('저장소에 다시 연결해 주세요',401);
 await saveConnection(provider,connection);return connection;
}
export async function deleteConnection(provider:Provider,owner:string) {
 const {error}=await database().from('crm_storage_connections').upsert({user_id:owner,provider,encrypted_connection:'',updated_at:new Date().toISOString()},{onConflict:'user_id,provider'});
 if(error)throw storageError();
}
