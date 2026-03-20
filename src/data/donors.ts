import type { Donor, DonorType } from './types';

const raw = `Donor,Min Amount,Type
Accenture,1290002,Pentagon Contractor
Aerospace Corporation,20000,Pentagon Contractor
Airbus,2020001,Pentagon Contractor
Anduril,50000,Pentagon Contractor
Aruba,104459,Foreign Government
Austal USA,0,Pentagon Contractor
Australia,4849565,Foreign Government
BAE Systems,655000,Pentagon Contractor
Bahrain,580095,Foreign Government
Bangladesh,0,Foreign Government
Battelle,75000,Pentagon Contractor
Bechtel,275000,Pentagon Contractor
Belgium,520000,Foreign Government
Boeing,1452072,Pentagon Contractor
Booz Allen Hamilton Holding Corporation,1720704,Pentagon Contractor
Boston Consulting Group,300000,Pentagon Contractor
Brazil,60000,Foreign Government
CACI,0,Pentagon Contractor
CAE,100000,Pentagon Contractor
Canada,13702539,Foreign Government
China,10000,Foreign Government
Colombia,2000,Foreign Government
Commonwealth of Nations,0,Foreign Government
Czechia,125000,Foreign Government
Deloitte,1301001,Pentagon Contractor
Denmark,1366002,Foreign Government
Dominican Republic,0,Foreign Government
Elbit Systems,180000,Pentagon Contractor
Estonia,456000,Foreign Government
European Union,10065004,Foreign Government
Federal Reserve,2000,U.S. Government
Fincantieri,375000,Pentagon Contractor
Finland,613987,Foreign Government
France,431001,Foreign Government
Fujitsu,105000,Pentagon Contractor
GE Aerospace,745002,Pentagon Contractor
General Atomics,1947500,Pentagon Contractor
General Dynamics,1048000,Pentagon Contractor
General Services Administration,343289,U.S. Government
Germany,9141250,Foreign Government
Hanwha Group,100000,Pentagon Contractor
HEICO,10124,Pentagon Contractor
Hensoldt,25000,Pentagon Contractor
Honeywell International,200000,Pentagon Contractor
Howmet Aerospace,50000,Pentagon Contractor
Huntington Ingalls,1050000,Pentagon Contractor
IBM,1620000,Pentagon Contractor
Iceland,25000,Foreign Government
India,295001,Foreign Government
International Republican Institute,170000,U.S. Government
Iraq,100000,Foreign Government
Ireland,89419,Foreign Government
Italy,25000,Foreign Government
Ivory Coast,0,Foreign Government
Jacobs,5000,Pentagon Contractor
Japan,9467837,Foreign Government
Kawasaki Heavy Industries,800,Pentagon Contractor
KNDS,275000,Pentagon Contractor
Kongsberg Gruppen,6000,Pentagon Contractor
Kuwait,60000,Foreign Government
L3Harris,290000,Pentagon Contractor
Latvia,660000,Foreign Government
Lebanon,1,Foreign Government
Leidos,510000,Pentagon Contractor
Leonardo,1570479,Pentagon Contractor
Library of Congress,50000,U.S. Government
Libya,5000,Foreign Government
Liechtenstein,10006,Foreign Government
Lithuania,575000,Foreign Government
Lockheed Martin,3431026,Pentagon Contractor
Lumen,124987,Pentagon Contractor
Luxembourg,210000,Foreign Government
Malta,0,Foreign Government
Maxar Technologies,50000,Pentagon Contractor
MBDA,145000,Pentagon Contractor
McKinsey & Company,751001,Pentagon Contractor
Merck,895000,Pentagon Contractor
Mexico,1000,Foreign Government
MITRE Corporation,1060000,Pentagon Contractor
Mitsubishi,2569340,Pentagon Contractor
Moog Inc,5000,Pentagon Contractor
NAMMO Inc,1000,Pentagon Contractor
National Aeronautics and Space Administration (NASA),6120846,U.S. Government
National Endowment for Democracy,210000,U.S. Government
National Endowment for the Arts,50000,U.S. Government
National Institutes of Health,200000,U.S. Government
National Science Foundation,200000,U.S. Government
NATO,1105327,Foreign Government
Netherlands,2196623,Foreign Government
New Zealand,5000,Foreign Government
Nigeria,25000,Foreign Government
Northern Ireland,100,Foreign Government
Northrop Grumman,7348501,Pentagon Contractor
Norway,8905978,Foreign Government
Oman,240000,Foreign Government
Organization for Security and Co-operation in Europe,10000,Foreign Government
Palantir Technologies,1025000,Pentagon Contractor
Parsons Corporation,65000,Pentagon Contractor
Peraton,275000,Pentagon Contractor
Poland,292001,Foreign Government
Qatar,10465000,Foreign Government
Rheinmetall AG,75000,Pentagon Contractor
Romania,20000,Foreign Government
RTX,2379502,Pentagon Contractor
Saab,2020001,Pentagon Contractor
Safran,170000,Pentagon Contractor
SAIC,1284752,Pentagon Contractor
Saudi Arabia,3052634,Foreign Government
Singapore,626256,Foreign Government
Slovakia,21000,Foreign Government
Small Business Administration,0,U.S. Government
South Korea,5441003,Foreign Government
Spain,1000,Foreign Government
ST Engineering,5000,Pentagon Contractor
Sweden,8205000,Foreign Government
Switzerland,958290,Foreign Government
Taiwan,6765265,Foreign Government
Tennessee Valley Authority,150000,U.S. Government
Textron,681000,Pentagon Contractor
Thailand,10000,Foreign Government
Thales Group,750000,Pentagon Contractor
Timor-Leste,250000,Foreign Government
Turkey,0,Foreign Government
Ukraine,1000,Foreign Government
United Arab Emirates,20045000,Foreign Government
United Kingdom,20961292,Foreign Government
United Nations,1696096,Foreign Government
United States Agency for International Development,6335000,U.S. Government
United States Environmental Protection Agency,1000,U.S. Government
United States Institute of Peace,230627,U.S. Government
US Congress,51647380,U.S. Government
US Department of Commerce,65000,U.S. Government
US Department of Defense,971533572,U.S. Government
US Department of Education,748224,U.S. Government
US Department of Energy,6403456,U.S. Government
US Department of Health and Human Services,373300000,U.S. Government
US Department of Homeland Security,338612273,U.S. Government
US Department of Housing and Urban Development,885003,U.S. Government
US Department of Interior,25000,U.S. Government
US Department of State,15905169,U.S. Government
US Department of the Treasury,260000,U.S. Government
US Government,7705522,U.S. Government
US government other federal agencies,93900000,U.S. Government
US Intelligence Agencies,351010,U.S. Government
US International Development Finance Corporation,10000,U.S. Government
US Office of Personnel Management,50000,U.S. Government
US Secret Service,25000,U.S. Government
Viasat,10000,Pentagon Contractor
Vietnam,20000,Foreign Government`;

export function parseDonors(): Donor[] {
  const lines = raw.trim().split('\n');
  return lines.slice(1).map(line => {
    // Handle lines with commas in names by finding the type at the end
    const lastComma = line.lastIndexOf(',');
    const type = line.substring(lastComma + 1).trim() as DonorType;
    const rest = line.substring(0, lastComma);
    const secondLastComma = rest.lastIndexOf(',');
    const minAmount = parseInt(rest.substring(secondLastComma + 1).trim()) || 0;
    const name = rest.substring(0, secondLastComma).trim();
    return { name, minAmount, type };
  });
}
