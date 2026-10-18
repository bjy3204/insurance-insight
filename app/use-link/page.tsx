import LegacyUseLinkPage from './LegacyUseLinkPage';
import WorkToolsPage from './WorkToolsPage';

export default function UseLinkPage(){
  return process.env.NODE_ENV === 'development' ? <WorkToolsPage/> : <LegacyUseLinkPage/>;
}
