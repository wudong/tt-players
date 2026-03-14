# UK League Expansion Research

Generated on 2026-03-10.

## Sources

- England directory: https://www.tabletennisengland.co.uk/leagues/
- Wales TT Leagues page: https://tabletennis.wales/tt-leagues/
- TT365 Sites sitemap: https://www.tabletennis365.com/Sites
- Table Tennis Ulster leagues page: https://tabletennisulster.com/leagues/

## Summary

- Scrape-ready league configs generated: 190
- Detailed verified dataset: `docs/uk-league-research-2026-03-10.csv`
- Generated worker config: `apps/worker/config/uk-leagues.generated.json`

| Country | Ready | Blocked |
| --- | ---: | ---: |
| England | 182 | 35 |
| Northern Ireland | 0 | 6 |
| Scotland | 3 | 4 |
| Wales | 5 | 2 |

## Sample Ready Rows

| Country | Region | League | Platform | URL | Divisions | Seasons |
| --- | --- | --- | --- | --- | ---: | ---: |
| England | Avon | Bath Table Tennis League | ttleagues | https://bath.ttleagues.com | 4 | 11 |
| England | Avon | Bristol Table Tennis League | ttleagues | https://bristol.ttleagues.com | 7 | 10 |
| England | Bedfordshire | Bedford Table Tennis League | ttleagues | https://bedford.ttleagues.com | 4 | 6 |
| England | Bedfordshire | Luton Table Tennis League | tt365 | https://www.tabletennis365.com/luton | 1 | 8 |
| England | Berkshire | Bracknell and Wokingham Table Tennis League | tt365 | https://www.tabletennis365.com/bracknellandwokingham | 3 | 7 |
| England | Berkshire | Maidenhead Table Tennis League | ttleagues | https://maidenhead.ttleagues.com | 3 | 10 |
| England | Berkshire | Newbury Table Tennis League | ttleagues | https://newbury.ttleagues.com | 3 | 19 |
| England | Berkshire | Reading & District Table Tennis Association | tt365 | https://www.tabletennis365.com/reading | 4 | 7 |
| England | Buckinghamshire | Aylesbury Table Tennis League | ttleagues | https://aylesbury.ttleagues.com | 5 | 12 |
| England | Buckinghamshire | Chalfonts Table Tennis League | ttleagues | https://chalfonts.ttleagues.com | 2 | 8 |
| England | Buckinghamshire | Chiltern Table Tennis League | ttleagues | https://chiltern.ttleagues.com | 2 | 11 |
| England | Buckinghamshire | High Wycombe Table Tennis League | ttleagues | https://highwycombe.ttleagues.com | 4 | 11 |
| England | Cambridgeshire | Cambridge Table Tennis League | ttleagues | https://cambridge.ttleagues.com | 4 | 11 |
| England | Cambridgeshire | Ely & District Table Tennis League | ttleagues | https://elydistrict.ttleagues.com | 3 | 11 |
| England | Cambridgeshire | Peterborough Table Tennis League | ttleagues | https://peterborough.ttleagues.com | 4 | 11 |
| England | Cheshire | Chester and Ellesmere Port Table Tennis League | ttleagues | https://chesterandellesmereport.ttleagues.com | 4 | 7 |
| England | Cheshire | Crewe Table Tennis League | ttleagues | https://crewe.ttleagues.com | 8 | 26 |
| England | Cheshire | Glossop Table Tennis League | ttleagues | https://glossop.ttleagues.com | 3 | 12 |
| England | Cheshire | Halton Table Tennis League | ttleagues | https://halton.ttleagues.com | 2 | 5 |
| England | Cheshire | Mid-Cheshire Table Tennis League | ttleagues | https://midcheshire.ttleagues.com | 2 | 8 |
| England | Cheshire | Trafford Table Tennis League | ttleagues | https://trafford.ttleagues.com | 3 | 12 |
| England | Cheshire | Wilmslow Table Tennis League | ttleagues | https://wilmslow.ttleagues.com | 3 | 15 |
| England | Cheshire | Wirral Table Tennis League | ttleagues | https://wirral.ttleagues.com | 3 | 8 |
| England | Cheshire|Lancashire | Lancashire And Cheshire Table Tennis League | ttleagues | https://lancashireandcheshire.ttleagues.com | 3 | 36 |
| England | Cleveland | Cleveland Table Tennis League | ttleagues | https://cleveland.ttleagues.com | 1 | 7 |
| England | Cleveland | Middlesbrough Table Tennis League | ttleagues | https://middlesbrough.ttleagues.com | 3 | 10 |
| England | Cleveland | Stockton Table Tennis League | ttleagues | https://stockton.ttleagues.com | 3 | 11 |
| England | Cornwall | North Cornwall Table Tennis League | tt365 | https://www.tabletennis365.com/northcornwall | 2 | 8 |
| England | Cornwall | West Cornwall Table Tennis League | ttleagues | https://westcornwall.ttleagues.com | 4 | 12 |
| England | Cumbria | Barrow Table Tennis League | ttleagues | https://barrow.ttleagues.com | 2 | 1 |
| England | Derbyshire | Chesterfield Table Tennis League | ttleagues | https://chesterfield.ttleagues.com | 4 | 6 |
| England | Derbyshire | Derby & District Table Tennis Association | ttleagues | https://derbydistrict.ttleagues.com | 4 | 9 |
| England | Derbyshire | Matlock Table Tennis League | ttleagues | https://matlock.ttleagues.com | 2 | 11 |
| England | Devonshire | Exeter Table Tennis League | ttleagues | https://exeter.ttleagues.com | 4 | 13 |
| England | Devonshire | South Devon and Torbay Table Tennis League | ttleagues | https://southdevonandtorbay.ttleagues.com | 4 | 11 |
| England | Dorset | Blackmore Vale Table Tennis League | ttleagues | https://blackmorevale.ttleagues.com | 2 | 3 |
| England | Dorset | Weymouth Table Tennis League | ttleagues | https://weymouth.ttleagues.com | 3 | 11 |
| England | Durham | Darlington Table Tennis League | ttleagues | https://darlington.ttleagues.com | 2 | 12 |
| England | Durham | Sunderland Table Tennis League | tt365 | https://www.tabletennis365.com/Sunderland | 3 | 7 |
| England | Essex | Basildon Table Tennis League | tt365 | https://www.tabletennis365.com/Basildon | 2 | 7 |

## Sample Blocked Rows

| Country | Region | League | Status | Official URL | Notes |
| --- | --- | --- | --- | --- | --- |
| England | Buckinghamshire | Milton Keynes Table Tennis League | unsupported_platform | https://www.mkttl.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Cleveland | Hartlepool Table Tennis League | inactive_or_unverified | https://hartlepool.ttleagues.com | Website: No active TT Leagues competitions were found |
| England | Cumbria | Kendal Table Tennis League | inactive_or_unverified | https://www.tabletennis365.com/Kendal | Website: No current TT365 divisions were found | Contact: No current TT365 divisions were found |
| England | Devonshire | North Devon Table Tennis League | inactive_or_unverified | https://northdevon.ttleagues.com | Website: No active TT Leagues competitions were found |
| England | Devonshire | Plymouth Table Tennis League | inactive_or_unverified | https://plymouth.ttleagues.com | Website: No active TT Leagues competitions were found |
| England | Dorset | Bournemouth Table Tennis League | unsupported_platform | https://www.bdtta.org.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Dorset | Wimborne Table Tennis League | unsupported_platform | https://www.wdttl.co.uk/index.php | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Essex | Southend Table Tennis League | inactive_or_unverified | https://southend.ttleagues.com | Website: No active TT Leagues competitions were found |
| England | Essex | West Essex Table Tennis League | inactive_or_unverified | https://www.tabletennis365.com/westessex | Website: No current TT365 divisions were found |
| England | Hampshire | Aldershot Table Tennis League | unsupported_platform | http://www.adttl.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Hampshire | Basingstoke Table Tennis League | unsupported_platform | http://www.basingstokett.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Hampshire | Southampton Table Tennis League | unsupported_platform | http://www.stta.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Hertfordshire | Hertford Table Tennis League | unsupported_platform | http://www.hertsttl.org.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Kent | Canterbury Table Tennis League | unsupported_platform | http://www.canterburytt.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Kent | Dover Table Tennis League | inactive_or_unverified | https://dover.ttleagues.com | Website: No active TT Leagues competitions were found |
| England | Lancashire | East Lancashire Table Tennis League | unsupported_platform | http://eastlancstt.org.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Lancashire | Liverpool Junior Table Tennis League | no_public_results_url |  | No public results URL was published by the governing body source. |
| England | Lancashire | Wigan Table Tennis League | inactive_or_unverified | https://www.tabletennis365.com/wigan | Website: No current TT365 divisions were found |
| England | Lincolnshire | Scunthorpe Table Tennis League | unsupported_platform | http://www.scunthorpetabletennis.co.uk/new | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Norfolk | Heacham Table Tennis League | unsupported_platform | http://www.malc-on-line.co.uk/tabletennis.htm | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Norfolk | South Norfolk Table Tennis League | unsupported_platform | https://www.facebook.com/pages/category/Sports-League/South-Norfolk-Table-Tennis-League-2216514978591475 | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Norfolk | Wisbech Table Tennis League | inactive_or_unverified | https://wisbech.ttleagues.com | Website: No active TT Leagues competitions were found |
| England | Nottinghamshire | Worksop Table Tennis League | unsupported_platform | http://www.worksoptabletennisleague.com | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Suffolk | Ipswich Table Tennis League | unsupported_platform | http://www.idttl.net | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Suffolk | Lowestoft Table Tennis League | unsupported_platform | https://ldttl.org.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Surrey | Sutton Table Tennis League | unsupported_platform | http://www.sdttl.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Sussex | Rother Junior TTL | unsupported_platform | https://tabletennisrother.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Sussex | South West Sussex Table Tennis League | unsupported_platform | http://www.swsttl.org.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Sussex | Sussex County Table Tennis Association | unsupported_platform | http://www.sctta.org.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Warwickshire | Stratford-upon-Avon Table Tennis League | inactive_or_unverified | https://www.tabletennis365.com/stratford-upon-avon | Website: No current TT365 divisions were found |
| England | Wiltshire | Salisbury Table Tennis League | inactive_or_unverified | https://salisbury.ttleagues.com | Website: HTTP 500 Internal Server Error for https://ttleagues-api.azurewebsites.net/api/competitions/archives |
| England | Yorkshire | Huddersfield Table Tennis League | unsupported_platform | http://www.huddersfieldtabletennisleague.co.uk | Official link points to a custom website rather than TT365 or TT Leagues. |
| England | Yorkshire | Northallerton Table Tennis League | inactive_or_unverified | https://northallerton.ttleagues.com | Website: No active TT Leagues competitions were found |
| England | Yorkshire | Ryedale Table Tennis League | inactive_or_unverified | https://www.tabletennis365.com/ryedale | Website: No current TT365 divisions were found |
| England | Yorkshire | Sheffield Table Tennis League | inactive_or_unverified | https://www.tabletennis365.com/Sheffield | Website: No current TT365 divisions were found |
| Northern Ireland | Belfast | Belfast and District Table Tennis League | no_public_results_url |  | Table Tennis Ulster says results are uploaded via the app or website, but no public results URL is published. |
| Northern Ireland | County Antrim | County Antrim League | no_public_results_url |  | Official Table Tennis Ulster page lists the league but does not publish a results URL. |
| Northern Ireland | County Down | East Down Churches League | no_public_results_url |  | Official Table Tennis Ulster page lists the league but does not publish a results URL. |
| Northern Ireland | County Down | Lecale League | no_public_results_url |  | Official Table Tennis Ulster page lists the league but does not publish a results URL. |
| Northern Ireland | Fermanagh | Fermanagh League | no_public_results_url |  | Official Table Tennis Ulster page lists the league but does not publish a results URL or divisions count. |

Full detail is in the CSV file; the markdown intentionally truncates the row lists for readability.
