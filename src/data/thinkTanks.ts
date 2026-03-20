import type { ThinkTank } from './types';
import { ideologyMap, foundingYearMap } from './supplemental';

const raw = `Think Tank,Foreign Government,Pentagon Contractor,U.S. Government,Transparency Score
America First Policy Institute,0,0,0,0
American Enterprise Institute,0,0,0,0
American Foreign Policy Council,0,0,0,0
Asia Society Policy Institute,140000,0,50000,3
Aspen Institute,1902000,1750000,7835000,4
Atlantic Council,25255000,12801001,10796001,3
Belfer Center for Science and International Relations,0,0,0,0
Berggruen Institute,0,0,0,5
Brookings Institution,18525001,3910000,2005002,3
Carnegie Endowment for International Peace,13845011,670008,3655001,4
Caspian Policy Center,0,0,0,0
Cato Institute,0,0,0,0
Center for a New American Security,3225001,8085000,4935000,4
Center for American Progress,600000,10000,0,2
Center for Economic and Policy Research,0,0,0,2
Center for Global Development,6265000,0,200000,4
Center for Immigration Studies,0,0,0,0
Center for International Policy,0,0,0,0
Center for Security Policy,0,0,0,0
Center for Strategic and Budgetary Assessments,0,0,0,2
Center for Strategic and International Studies,2230000,6230000,0,4
Center for the National Interest,0,0,0,0
Center for Transatlantic Relations,0,0,0,0
Center on Budget and Policy Priorities,0,0,0,3
Chicago Council on Global Affairs,64597,115219,19000,3
Council on Foreign Relations,0,2445000,0,3
Demos,0,0,0,2
Discovery Institute,0,0,0,0
Economic Policy Institute,0,0,0,3
Foreign Policy Research Institute,410000,20000,300000,4
Foundation for Defense of Democracies,0,0,0,0
Freedom House,0,0,0,3
Gatestone Institute,0,0,0,0
German Marshall Fund,19559022,1251010,3335009,3
Global Center on Cooperative Security,0,0,0,3
Global Security Institute,0,0,0,0
Global Taiwan Institute,0,0,0,0
Heartland Institute,0,0,0,0
Heritage Foundation,0,0,0,2
Hoover Institution,150000,0,0,3
Hudson Institute,1585000,2600000,0,4
Human Rights Watch,0,0,0,2
Independent Institute,0,0,0,3
Information Technology & Innovation Foundation,15000,75000,0,2
Institute for the Study of Global Antisemitism and Policy,0,0,0,0
Institute for the Study of War,0,0,0,3
Inter-American Dialogue,325000,100000,356000,3
International Peace Institute,0,0,0,2
Israel Policy Forum,0,0,0,3
Jack Gordon Institute for Public Policy,0,0,0,0
Manhattan Institute for Policy Research,0,0,0,0
Mercatus Center,0,0,0,0
Middle East Forum,0,0,0,0
Middle East Institute,13703813,192525,406164,4
Middle East Policy Council,0,0,0,0
National Bureau of Asian Research,0,0,0,3
New America,316000,801000,2675000,5
Newlines Institute for Strategy and Policy,0,0,0,0
Niskanen Center,0,0,0,4
Nuclear Threat Initiative,0,0,0,2
Pacific Council,50000,0,0,3
Pacific Forum International,3500,8000,0,3
Peterson Institute for International Economics,1900022,575002,0,3
Potomac Institute for Policy Studies,0,0,40580180,4
Quincy Institute for Responsible Statecraft,0,0,0,4
R Street,0,0,0,0
RAND,18500000,1000000,1737500000,3
Stimson Center,15689064,1684030,9149634,5
The Arab Gulf States Institute,20000,20000,0,3
The Jewish Institute For National Security Of America,0,0,0,0
The Vandenberg Coalition,0,0,0,0
Third Way,0,0,0,0
Washington Institute for Near East Policy,0,0,0,0
Wilson Center,591000,150000,51692380,3
Yorktown Institute,0,0,0,0`;

export function parseThinkTanks(): ThinkTank[] {
  const lines = raw.trim().split('\n');
  return lines.slice(1).map(line => {
    const parts = line.split(',');
    const name = parts[0];
    const foreignGov = parseInt(parts[1]) || 0;
    const pentagonContractor = parseInt(parts[2]) || 0;
    const usGov = parseInt(parts[3]) || 0;
    const transparencyScore = parseInt(parts[4]) || 0;
    const totalFunding = foreignGov + pentagonContractor + usGov;
    return {
      name,
      foreignGov,
      pentagonContractor,
      usGov,
      transparencyScore,
      totalFunding,
      isDarkMoney: totalFunding === 0,
      ideology: ideologyMap[name] || 'Center',
      foundingYear: foundingYearMap[name] || 2000,
    };
  });
}
