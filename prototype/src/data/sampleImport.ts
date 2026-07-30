/**
 * The spreadsheet the import wizard's "Use the sample file" button loads (UIP-2).
 *
 * Held inline rather than fetched from /public so the prototype makes no network requests
 * at all — it runs from a file:// path or an embedded page as happily as from a dev server.
 * `public/sample-import.csv` stays alongside it so a reviewer can grab a real file to drag in.
 */
export const SAMPLE_IMPORT_CSV = `Title,Inventor,Inventor Email,Disclosure Date,Classification,Keywords,Internal Description
Thermally Regulated Beehive Enclosure,Dr. Naomi Ferrell,n.ferrell@usd.example.edu,2019-05-14,Agriculture / Food,"bees, pollinators, overwintering",Passive thermal mass arrangement that holds cluster temperature through northern winters.
Portable Water Arsenic Test Strip,Dr. Owen Brackett,o.brackett@usd.example.edu,2015-11-02,Environmental,"water quality, rural, testing",Reagent chemistry tuned to the arsenic range found in regional well water.
Adaptive Grip for Arthritic Hands,Dr. Elena Whitcomb,e.whitcomb@usd.example.edu,2022-08-19,Medical device,"assistive, ergonomics, arthritis",Compliant mechanism that redistributes grip force away from affected joints.
Silage Spoilage Early Detection,,,2020-03-30,Agriculture / Food,"silage, sensors, livestock feed",Gas signature detection in the headspace of a covered pile.
Recycled Glass Road Aggregate,Dr. Paul Nkemdirim,,2017-07-08,Materials,"recycling, roads, aggregate",Processing route producing an aggregate that meets state DOT gradation specs.
Sign Language Tutoring Tool,Dr. Hannah Boyle,h.boyle@usd.example.edu,2023-01-25,Software,"accessibility, education, ASL",Gesture recognition model trained on regional signing variation.
`;
