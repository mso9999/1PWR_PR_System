{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 Menlo-Regular;}
{\colortbl;\red255\green255\blue255;\red46\green49\blue51;\red21\green98\blue39;\red246\green247\blue249;
\red20\green67\blue174;\red24\green25\blue27;\red162\green0\blue16;\red186\green6\blue115;\red77\green80\blue85;
\red18\green115\blue126;}
{\*\expandedcolortbl;;\cssrgb\c23529\c25098\c26275;\cssrgb\c7451\c45098\c20000;\cssrgb\c97255\c97647\c98039;
\cssrgb\c9412\c35294\c73725;\cssrgb\c12549\c12941\c14118;\cssrgb\c70196\c7843\c7059;\cssrgb\c78824\c15294\c52549;\cssrgb\c37255\c38824\c40784;
\cssrgb\c3529\c52157\c56863;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs26 \cf2 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 \
\
\pard\pardeftab720\partightenfactor0
\cf3 \cb4 \strokec3 /**\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  * Synchronizes Submitted sheet with Master Log data\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  * Headers: PR Number, Description, Submitted By, Submitted Date, \cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  *          Resubmitted Date, Days Open, Days Since Resubmission, Link\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  */\cf2 \cb1 \strokec2 \
\pard\pardeftab720\partightenfactor0
\cf5 \cb4 \strokec5 function\cf2 \strokec2  \cf6 \strokec6 syncSubmittedSheet\cf2 \strokec2 () \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf2 \cb4     \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 log\cf2 \strokec2 (\cf7 \strokec7 'Starting Submitted sheet synchronization'\cf2 \strokec2 );\cb1 \
\cb4     \cb1 \
\cb4     \cf5 \strokec5 try\cf2 \strokec2  \{\cb1 \
\cb4         \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 ss\cf2 \strokec2  = \cf8 \strokec8 SpreadsheetApp\cf2 \strokec2 .\cf6 \strokec6 openById\cf2 \strokec2 (\cf8 \strokec8 SPREADSHEET_ID\cf2 \strokec2 );\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Get Master Log data\cf2 \cb1 \strokec2 \
\cb4         \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 masterSheet\cf2 \strokec2  = \cf6 \strokec6 ss\cf2 \strokec2 .\cf6 \strokec6 getSheetByName\cf2 \strokec2 (\cf8 \strokec8 CONFIG\cf2 \strokec2 .\cf8 \strokec8 MASTER_LOG_TAB\cf2 \strokec2 );\cb1 \
\cb4         \cf5 \strokec5 if\cf2 \strokec2  (!\cf6 \strokec6 masterSheet\cf2 \strokec2 ) \cf5 \strokec5 throw\cf2 \strokec2  \cf5 \strokec5 new\cf2 \strokec2  \cf8 \strokec8 Error\cf2 \strokec2 (\cf7 \strokec7 'Master Log sheet not found'\cf2 \strokec2 );\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Get or create Submitted sheet\cf2 \cb1 \strokec2 \
\cb4         \cf5 \strokec5 let\cf2 \strokec2  \cf6 \strokec6 submittedSheet\cf2 \strokec2  = \cf6 \strokec6 ss\cf2 \strokec2 .\cf6 \strokec6 getSheetByName\cf2 \strokec2 (\cf7 \strokec7 'Submitted'\cf2 \strokec2 );\cb1 \
\cb4         \cf5 \strokec5 if\cf2 \strokec2  (!\cf6 \strokec6 submittedSheet\cf2 \strokec2 ) \{\cb1 \
\cb4             \cf6 \strokec6 submittedSheet\cf2 \strokec2  = \cf6 \strokec6 ss\cf2 \strokec2 .\cf6 \strokec6 insertSheet\cf2 \strokec2 (\cf7 \strokec7 'Submitted'\cf2 \strokec2 );\cb1 \
\cb4             \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 log\cf2 \strokec2 (\cf7 \strokec7 'Created new Submitted sheet'\cf2 \strokec2 );\cb1 \
\cb4         \}\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Headers are correct - no change needed\cf2 \cb1 \strokec2 \
\cb4         \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 headers\cf2 \strokec2  = [\cb1 \
\cb4             \cf7 \strokec7 'PR Number'\cf2 \strokec2 ,\cb1 \
\cb4             \cf7 \strokec7 'Description'\cf2 \strokec2 ,\cb1 \
\cb4             \cf7 \strokec7 'Submitted By'\cf2 \strokec2 ,\cb1 \
\cb4             \cf7 \strokec7 'Submitted Date'\cf2 \strokec2 ,\cb1 \
\cb4             \cf7 \strokec7 'Resubmitted Date'\cf2 \strokec2 ,\cb1 \
\cb4             \cf7 \strokec7 'Days Open'\cf2 \strokec2 ,\cb1 \
\cb4             \cf7 \strokec7 'Days Since Resubmission'\cf2 \strokec2 ,\cb1 \
\cb4             \cf7 \strokec7 'Link'\cf2 \cb1 \strokec2 \
\cb4         ];\cb1 \
\cb4         \cb1 \
\cb4         \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 masterData\cf2 \strokec2  = \cf6 \strokec6 masterSheet\cf2 \strokec2 .\cf6 \strokec6 getDataRange\cf2 \strokec2 ().\cf6 \strokec6 getValues\cf2 \strokec2 ();\cb1 \
\cb4         \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 masterHeaders\cf2 \strokec2  = \cf6 \strokec6 masterData\cf2 \strokec2 [\cf10 \strokec10 0\cf2 \strokec2 ];\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Update column indices to use COL constant for consistency\cf2 \cb1 \strokec2 \
\cb4         \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 colIndices\cf2 \strokec2  = \{\cb1 \
\cb4             \cf6 \strokec6 prNumber\cf2 \strokec2 : \cf8 \strokec8 COL\cf2 \strokec2 .\cf8 \strokec8 PR_NUMBER\cf2 \strokec2 ,\cb1 \
\cb4             \cf6 \strokec6 description\cf2 \strokec2 : \cf8 \strokec8 COL\cf2 \strokec2 .\cf8 \strokec8 DESCRIPTION\cf2 \strokec2 ,\cb1 \
\cb4             \cf6 \strokec6 submittedBy\cf2 \strokec2 : \cf8 \strokec8 COL\cf2 \strokec2 .\cf8 \strokec8 REQUESTOR_NAME\cf2 \strokec2 ,\cb1 \
\cb4             \cf6 \strokec6 submittedDate\cf2 \strokec2 : \cf8 \strokec8 COL\cf2 \strokec2 .\cf8 \strokec8 TIMESTAMP\cf2 \strokec2 ,\cb1 \
\cb4             \cf6 \strokec6 resubmittedDate\cf2 \strokec2 : \cf8 \strokec8 COL\cf2 \strokec2 .\cf8 \strokec8 OVERRIDE_DATE\cf2 \strokec2 ,\cb1 \
\cb4             \cf6 \strokec6 status\cf2 \strokec2 : \cf8 \strokec8 COL\cf2 \strokec2 .\cf8 \strokec8 PR_STATUS\cf2 \cb1 \strokec2 \
\cb4         \};\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Validation stays the same\cf2 \cb1 \strokec2 \
\cb4         \cf5 \strokec5 for\cf2 \strokec2  (\cf5 \strokec5 const\cf2 \strokec2  [\cf6 \strokec6 key\cf2 \strokec2 , \cf6 \strokec6 index\cf2 \strokec2 ] \cf5 \strokec5 of\cf2 \strokec2  \cf8 \strokec8 Object\cf2 \strokec2 .\cf6 \strokec6 entries\cf2 \strokec2 (\cf6 \strokec6 colIndices\cf2 \strokec2 )) \{\cb1 \
\cb4             \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 index\cf2 \strokec2  === -\cf10 \strokec10 1\cf2 \strokec2 ) \cf5 \strokec5 throw\cf2 \strokec2  \cf5 \strokec5 new\cf2 \strokec2  \cf8 \strokec8 Error\cf2 \strokec2 (\cf7 \strokec7 `Column not found in Master Log: \cf2 \strokec2 $\{\cf6 \strokec6 key\cf2 \strokec2 \}\cf7 \strokec7 `\cf2 \strokec2 );\cb1 \
\cb4         \}\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Update the data mapping to fix Days Since Resubmission calculation\cf2 \cb1 \strokec2 \
\cb4         \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 submittedData\cf2 \strokec2  = \cf6 \strokec6 masterData\cf2 \strokec2 .\cf6 \strokec6 slice\cf2 \strokec2 (\cf10 \strokec10 1\cf2 \strokec2 ) \cf9 \strokec9 // Skip header row\cf2 \cb1 \strokec2 \
\cb4             .\cf6 \strokec6 filter\cf2 \strokec2 (\cf6 \strokec6 row\cf2 \strokec2  => \cf6 \strokec6 row\cf2 \strokec2 [\cf6 \strokec6 colIndices\cf2 \strokec2 .\cf6 \strokec6 status\cf2 \strokec2 ] === \cf7 \strokec7 'Submitted'\cf2 \strokec2 )\cb1 \
\cb4             .\cf6 \strokec6 map\cf2 \strokec2 (\cf6 \strokec6 row\cf2 \strokec2  => \{\cb1 \
\cb4                 \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 submittedDate\cf2 \strokec2  = \cf6 \strokec6 row\cf2 \strokec2 [\cf6 \strokec6 colIndices\cf2 \strokec2 .\cf6 \strokec6 submittedDate\cf2 \strokec2 ];\cb1 \
\cb4                 \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 resubmittedDate\cf2 \strokec2  = \cf6 \strokec6 row\cf2 \strokec2 [\cf6 \strokec6 colIndices\cf2 \strokec2 .\cf6 \strokec6 resubmittedDate\cf2 \strokec2 ];\cb1 \
\cb4                 \cb1 \
\cb4                 \cf9 \strokec9 // Calculate days since resubmission if applicable\cf2 \cb1 \strokec2 \
\cb4                 \cf5 \strokec5 let\cf2 \strokec2  \cf6 \strokec6 daysSinceResubmission\cf2 \strokec2  = \cf7 \strokec7 ''\cf2 \strokec2 ;\cb1 \
\cb4                 \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 resubmittedDate\cf2 \strokec2 ) \{\cb1 \
\cb4                     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 now\cf2 \strokec2  = \cf5 \strokec5 new\cf2 \strokec2  \cf8 \strokec8 Date\cf2 \strokec2 ();\cb1 \
\cb4                     \cf6 \strokec6 daysSinceResubmission\cf2 \strokec2  = \cf8 \strokec8 Math\cf2 \strokec2 .\cf6 \strokec6 floor\cf2 \strokec2 (\cb1 \
\cb4                         (\cf6 \strokec6 now\cf2 \strokec2  - \cf5 \strokec5 new\cf2 \strokec2  \cf8 \strokec8 Date\cf2 \strokec2 (\cf6 \strokec6 resubmittedDate\cf2 \strokec2 )) / (\cf10 \strokec10 1000\cf2 \strokec2  * \cf10 \strokec10 60\cf2 \strokec2  * \cf10 \strokec10 60\cf2 \strokec2  * \cf10 \strokec10 24\cf2 \strokec2 )\cb1 \
\cb4                     );\cb1 \
\cb4                 \}\cb1 \
\cb4                 \cb1 \
\cb4                 \cf5 \strokec5 return\cf2 \strokec2  [\cb1 \
\cb4                     \cf6 \strokec6 row\cf2 \strokec2 [\cf6 \strokec6 colIndices\cf2 \strokec2 .\cf6 \strokec6 prNumber\cf2 \strokec2 ],\cb1 \
\cb4                     \cf6 \strokec6 row\cf2 \strokec2 [\cf6 \strokec6 colIndices\cf2 \strokec2 .\cf6 \strokec6 description\cf2 \strokec2 ],\cb1 \
\cb4                     \cf6 \strokec6 row\cf2 \strokec2 [\cf6 \strokec6 colIndices\cf2 \strokec2 .\cf6 \strokec6 submittedBy\cf2 \strokec2 ],\cb1 \
\cb4                     \cf6 \strokec6 submittedDate\cf2 \strokec2 ,\cb1 \
\cb4                     \cf6 \strokec6 resubmittedDate\cf2 \strokec2  || \cf7 \strokec7 ''\cf2 \strokec2 ,  \cf9 \strokec9 // Ensure empty string if null\cf2 \cb1 \strokec2 \
\cb4                     \cf6 \strokec6 calculateDaysOpen\cf2 \strokec2 (\cf6 \strokec6 submittedDate\cf2 \strokec2 ),\cb1 \
\cb4                     \cf6 \strokec6 daysSinceResubmission\cf2 \strokec2 ,  \cf9 \strokec9 // Updated calculation\cf2 \cb1 \strokec2 \
\cb4                     \cf6 \strokec6 generateViewLink\cf2 \strokec2 (\cf6 \strokec6 row\cf2 \strokec2 [\cf6 \strokec6 colIndices\cf2 \strokec2 .\cf6 \strokec6 prNumber\cf2 \strokec2 ])\cb1 \
\cb4                 ];\cb1 \
\cb4             \});\cb1 \
\cb4             \cb1 \
\cb4         \cf9 \strokec9 // Clear and set headers\cf2 \cb1 \strokec2 \
\cb4         \cf6 \strokec6 submittedSheet\cf2 \strokec2 .\cf6 \strokec6 clear\cf2 \strokec2 ();\cb1 \
\cb4         \cf6 \strokec6 submittedSheet\cf2 \strokec2 .\cf6 \strokec6 getRange\cf2 \strokec2 (\cf10 \strokec10 1\cf2 \strokec2 , \cf10 \strokec10 1\cf2 \strokec2 , \cf10 \strokec10 1\cf2 \strokec2 , \cf6 \strokec6 headers\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2 )\cb1 \
\cb4             .\cf6 \strokec6 setValues\cf2 \strokec2 ([\cf6 \strokec6 headers\cf2 \strokec2 ])\cb1 \
\cb4             .\cf6 \strokec6 setFontWeight\cf2 \strokec2 (\cf7 \strokec7 'bold'\cf2 \strokec2 )\cb1 \
\cb4             .\cf6 \strokec6 setBackground\cf2 \strokec2 (\cf7 \strokec7 '#E8EAED'\cf2 \strokec2 );\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Write data if exists\cf2 \cb1 \strokec2 \
\cb4         \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 submittedData\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2  > \cf10 \strokec10 0\cf2 \strokec2 ) \{\cb1 \
\cb4             \cf6 \strokec6 submittedSheet\cf2 \strokec2 .\cf6 \strokec6 getRange\cf2 \strokec2 (\cf10 \strokec10 2\cf2 \strokec2 , \cf10 \strokec10 1\cf2 \strokec2 , \cf6 \strokec6 submittedData\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2 , \cf6 \strokec6 headers\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2 )\cb1 \
\cb4                 .\cf6 \strokec6 setValues\cf2 \strokec2 (\cf6 \strokec6 submittedData\cf2 \strokec2 );\cb1 \
\cb4                 \cb1 \
\cb4             \cf9 \strokec9 // Format date columns\cf2 \cb1 \strokec2 \
\cb4             \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 dateColumns\cf2 \strokec2  = [\cf10 \strokec10 4\cf2 \strokec2 , \cf10 \strokec10 5\cf2 \strokec2 ]; \cf9 \strokec9 // Submitted Date and Resubmitted Date columns\cf2 \cb1 \strokec2 \
\cb4             \cf6 \strokec6 dateColumns\cf2 \strokec2 .\cf6 \strokec6 forEach\cf2 \strokec2 (\cf6 \strokec6 col\cf2 \strokec2  => \{\cb1 \
\cb4                 \cf6 \strokec6 submittedSheet\cf2 \strokec2 .\cf6 \strokec6 getRange\cf2 \strokec2 (\cf10 \strokec10 2\cf2 \strokec2 , \cf6 \strokec6 col\cf2 \strokec2 , \cf6 \strokec6 submittedData\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2 , \cf10 \strokec10 1\cf2 \strokec2 )\cb1 \
\cb4                     .\cf6 \strokec6 setNumberFormat\cf2 \strokec2 (\cf7 \strokec7 'yyyy-mm-dd hh:mm:ss'\cf2 \strokec2 );\cb1 \
\cb4             \});\cb1 \
\cb4             \cb1 \
\cb4             \cf9 \strokec9 // Format numeric columns\cf2 \cb1 \strokec2 \
\cb4             \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 numericColumns\cf2 \strokec2  = [\cf10 \strokec10 6\cf2 \strokec2 , \cf10 \strokec10 7\cf2 \strokec2 ]; \cf9 \strokec9 // Days Open and Days Since Resubmission\cf2 \cb1 \strokec2 \
\cb4             \cf6 \strokec6 numericColumns\cf2 \strokec2 .\cf6 \strokec6 forEach\cf2 \strokec2 (\cf6 \strokec6 col\cf2 \strokec2  => \{\cb1 \
\cb4                 \cf6 \strokec6 submittedSheet\cf2 \strokec2 .\cf6 \strokec6 getRange\cf2 \strokec2 (\cf10 \strokec10 2\cf2 \strokec2 , \cf6 \strokec6 col\cf2 \strokec2 , \cf6 \strokec6 submittedData\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2 , \cf10 \strokec10 1\cf2 \strokec2 )\cb1 \
\cb4                     .\cf6 \strokec6 setNumberFormat\cf2 \strokec2 (\cf7 \strokec7 '#,##0'\cf2 \strokec2 );\cb1 \
\cb4             \});\cb1 \
\cb4         \}\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Auto-size columns\cf2 \cb1 \strokec2 \
\cb4         \cf6 \strokec6 submittedSheet\cf2 \strokec2 .\cf6 \strokec6 autoResizeColumns\cf2 \strokec2 (\cf10 \strokec10 1\cf2 \strokec2 , \cf6 \strokec6 headers\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2 );\cb1 \
\cb4         \cb1 \
\cb4         \cf9 \strokec9 // Freeze header row\cf2 \cb1 \strokec2 \
\cb4         \cf6 \strokec6 submittedSheet\cf2 \strokec2 .\cf6 \strokec6 setFrozenRows\cf2 \strokec2 (\cf10 \strokec10 1\cf2 \strokec2 );\cb1 \
\cb4         \cb1 \
\cb4         \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 log\cf2 \strokec2 (\cf7 \strokec7 `Synchronized Submitted sheet with \cf2 \strokec2 $\{\cf6 \strokec6 submittedData\cf2 \strokec2 .\cf6 \strokec6 length\cf2 \strokec2 \}\cf7 \strokec7  records`\cf2 \strokec2 );\cb1 \
\cb4         \cf5 \strokec5 return\cf2 \strokec2  \cf5 \strokec5 true\cf2 \strokec2 ;\cb1 \
\cb4         \cb1 \
\cb4     \} \cf5 \strokec5 catch\cf2 \strokec2  (\cf6 \strokec6 error\cf2 \strokec2 ) \{\cb1 \
\cb4         \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 error\cf2 \strokec2 (\cf7 \strokec7 'Error synchronizing Submitted sheet:'\cf2 \strokec2 , \cf6 \strokec6 error\cf2 \strokec2 );\cb1 \
\cb4         \cf5 \strokec5 throw\cf2 \strokec2  \cf6 \strokec6 error\cf2 \strokec2 ;\cb1 \
\cb4     \}\cb1 \
\cb4 \}\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf9 \cb4 \strokec9 // Add helper function if not already present\cf2 \cb1 \strokec2 \
\pard\pardeftab720\partightenfactor0
\cf5 \cb4 \strokec5 function\cf2 \strokec2  \cf6 \strokec6 calculateDaysOpen\cf2 \strokec2 (\cf6 \strokec6 startDate\cf2 \strokec2 ) \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf2 \cb4     \cf5 \strokec5 if\cf2 \strokec2  (!\cf6 \strokec6 startDate\cf2 \strokec2 ) \cf5 \strokec5 return\cf2 \strokec2  \cf10 \strokec10 0\cf2 \strokec2 ;\cb1 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 start\cf2 \strokec2  = \cf5 \strokec5 new\cf2 \strokec2  \cf8 \strokec8 Date\cf2 \strokec2 (\cf6 \strokec6 startDate\cf2 \strokec2 );\cb1 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 now\cf2 \strokec2  = \cf5 \strokec5 new\cf2 \strokec2  \cf8 \strokec8 Date\cf2 \strokec2 ();\cb1 \
\cb4     \cf5 \strokec5 return\cf2 \strokec2  \cf8 \strokec8 Math\cf2 \strokec2 .\cf6 \strokec6 floor\cf2 \strokec2 ((\cf6 \strokec6 now\cf2 \strokec2  - \cf6 \strokec6 start\cf2 \strokec2 ) / (\cf10 \strokec10 1000\cf2 \strokec2  * \cf10 \strokec10 60\cf2 \strokec2  * \cf10 \strokec10 60\cf2 \strokec2  * \cf10 \strokec10 24\cf2 \strokec2 ));\cb1 \
\cb4 \}\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf3 \cb4 \strokec3 /**\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  * Sets up time-based trigger for synchronization\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  */\cf2 \cb1 \strokec2 \
\pard\pardeftab720\partightenfactor0
\cf5 \cb4 \strokec5 function\cf2 \strokec2  \cf6 \strokec6 setupSyncTrigger\cf2 \strokec2 () \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf2 \cb4     \cf9 \strokec9 // Delete any existing sync triggers\cf2 \cb1 \strokec2 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 triggers\cf2 \strokec2  = \cf8 \strokec8 ScriptApp\cf2 \strokec2 .\cf6 \strokec6 getProjectTriggers\cf2 \strokec2 ();\cb1 \
\cb4     \cf6 \strokec6 triggers\cf2 \strokec2 .\cf6 \strokec6 forEach\cf2 \strokec2 (\cf6 \strokec6 trigger\cf2 \strokec2  => \{\cb1 \
\cb4         \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 trigger\cf2 \strokec2 .\cf6 \strokec6 getHandlerFunction\cf2 \strokec2 () === \cf7 \strokec7 'syncSubmittedSheet'\cf2 \strokec2 ) \{\cb1 \
\cb4             \cf8 \strokec8 ScriptApp\cf2 \strokec2 .\cf6 \strokec6 deleteTrigger\cf2 \strokec2 (\cf6 \strokec6 trigger\cf2 \strokec2 );\cb1 \
\cb4         \}\cb1 \
\cb4     \});\cb1 \
\cb4     \cb1 \
\cb4     \cf9 \strokec9 // Create new trigger to run every minute\cf2 \cb1 \strokec2 \
\cb4     \cf8 \strokec8 ScriptApp\cf2 \strokec2 .\cf6 \strokec6 newTrigger\cf2 \strokec2 (\cf7 \strokec7 'syncSubmittedSheet'\cf2 \strokec2 )\cb1 \
\cb4         .\cf6 \strokec6 timeBased\cf2 \strokec2 ()\cb1 \
\cb4         .\cf6 \strokec6 everyMinutes\cf2 \strokec2 (\cf10 \strokec10 1\cf2 \strokec2 )\cb1 \
\cb4         .\cf6 \strokec6 create\cf2 \strokec2 ();\cb1 \
\cb4     \cb1 \
\cb4     \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 log\cf2 \strokec2 (\cf7 \strokec7 'Sync trigger set up successfully'\cf2 \strokec2 );\cb1 \
\cb4 \}\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf3 \cb4 \strokec3 /**\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  * Sets up trigger to sync on edit of Master Log\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  */\cf2 \cb1 \strokec2 \
\pard\pardeftab720\partightenfactor0
\cf5 \cb4 \strokec5 function\cf2 \strokec2  \cf6 \strokec6 setupEditTrigger\cf2 \strokec2 () \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf2 \cb4     \cf9 \strokec9 // Delete any existing edit triggers\cf2 \cb1 \strokec2 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 triggers\cf2 \strokec2  = \cf8 \strokec8 ScriptApp\cf2 \strokec2 .\cf6 \strokec6 getProjectTriggers\cf2 \strokec2 ();\cb1 \
\cb4     \cf6 \strokec6 triggers\cf2 \strokec2 .\cf6 \strokec6 forEach\cf2 \strokec2 (\cf6 \strokec6 trigger\cf2 \strokec2  => \{\cb1 \
\cb4         \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 trigger\cf2 \strokec2 .\cf6 \strokec6 getHandlerFunction\cf2 \strokec2 () === \cf7 \strokec7 'onMasterLogEdit'\cf2 \strokec2 ) \{\cb1 \
\cb4             \cf8 \strokec8 ScriptApp\cf2 \strokec2 .\cf6 \strokec6 deleteTrigger\cf2 \strokec2 (\cf6 \strokec6 trigger\cf2 \strokec2 );\cb1 \
\cb4         \}\cb1 \
\cb4     \});\cb1 \
\cb4     \cb1 \
\cb4     \cf9 \strokec9 // Create new edit trigger\cf2 \cb1 \strokec2 \
\cb4     \cf8 \strokec8 ScriptApp\cf2 \strokec2 .\cf6 \strokec6 newTrigger\cf2 \strokec2 (\cf7 \strokec7 'onMasterLogEdit'\cf2 \strokec2 )\cb1 \
\cb4         .\cf6 \strokec6 forSpreadsheet\cf2 \strokec2 (\cf8 \strokec8 SPREADSHEET_ID\cf2 \strokec2 )\cb1 \
\cb4         .\cf6 \strokec6 onEdit\cf2 \strokec2 ()\cb1 \
\cb4         .\cf6 \strokec6 create\cf2 \strokec2 ();\cb1 \
\cb4     \cb1 \
\cb4     \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 log\cf2 \strokec2 (\cf7 \strokec7 'Edit trigger set up successfully'\cf2 \strokec2 );\cb1 \
\cb4 \}\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf3 \cb4 \strokec3 /**\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  * Handles edits to Master Log\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  */\cf2 \cb1 \strokec2 \
\pard\pardeftab720\partightenfactor0
\cf5 \cb4 \strokec5 function\cf2 \strokec2  \cf6 \strokec6 onMasterLogEdit\cf2 \strokec2 (\cf6 \strokec6 e\cf2 \strokec2 ) \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf2 \cb4     \cf5 \strokec5 if\cf2 \strokec2  (!\cf6 \strokec6 e\cf2 \strokec2  || !\cf6 \strokec6 e\cf2 \strokec2 .\cf6 \strokec6 range\cf2 \strokec2 ) \cf5 \strokec5 return\cf2 \strokec2 ;\cb1 \
\cb4     \cb1 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 sheet\cf2 \strokec2  = \cf6 \strokec6 e\cf2 \strokec2 .\cf6 \strokec6 range\cf2 \strokec2 .\cf6 \strokec6 getSheet\cf2 \strokec2 ();\cb1 \
\cb4     \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 sheet\cf2 \strokec2 .\cf6 \strokec6 getName\cf2 \strokec2 () !== \cf8 \strokec8 CONFIG\cf2 \strokec2 .\cf8 \strokec8 MASTER_LOG_TAB\cf2 \strokec2 ) \cf5 \strokec5 return\cf2 \strokec2 ;\cb1 \
\cb4     \cb1 \
\cb4     \cf9 \strokec9 // Get the edited row data\cf2 \cb1 \strokec2 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 row\cf2 \strokec2  = \cf6 \strokec6 e\cf2 \strokec2 .\cf6 \strokec6 range\cf2 \strokec2 .\cf6 \strokec6 getRow\cf2 \strokec2 ();\cb1 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 masterData\cf2 \strokec2  = \cf6 \strokec6 sheet\cf2 \strokec2 .\cf6 \strokec6 getDataRange\cf2 \strokec2 ().\cf6 \strokec6 getValues\cf2 \strokec2 ();\cb1 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 headers\cf2 \strokec2  = \cf6 \strokec6 masterData\cf2 \strokec2 [\cf10 \strokec10 0\cf2 \strokec2 ];\cb1 \
\cb4     \cb1 \
\cb4     \cf9 \strokec9 // Check if status column was edited\cf2 \cb1 \strokec2 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 statusCol\cf2 \strokec2  = \cf6 \strokec6 headers\cf2 \strokec2 .\cf6 \strokec6 indexOf\cf2 \strokec2 (\cf7 \strokec7 'PR Status'\cf2 \strokec2 );\cb1 \
\cb4     \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 statusCol\cf2 \strokec2  === -\cf10 \strokec10 1\cf2 \strokec2 ) \cf5 \strokec5 return\cf2 \strokec2 ;\cb1 \
\cb4     \cb1 \
\cb4     \cf9 \strokec9 // If status is or was 'Submitted', sync the Submitted sheet\cf2 \cb1 \strokec2 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 oldValue\cf2 \strokec2  = \cf6 \strokec6 e\cf2 \strokec2 .\cf6 \strokec6 oldValue\cf2 \strokec2 ;\cb1 \
\cb4     \cf5 \strokec5 const\cf2 \strokec2  \cf6 \strokec6 newValue\cf2 \strokec2  = \cf6 \strokec6 e\cf2 \strokec2 .\cf6 \strokec6 value\cf2 \strokec2 ;\cb1 \
\cb4     \cf5 \strokec5 if\cf2 \strokec2  (\cf6 \strokec6 oldValue\cf2 \strokec2  === \cf7 \strokec7 'Submitted'\cf2 \strokec2  || \cf6 \strokec6 newValue\cf2 \strokec2  === \cf7 \strokec7 'Submitted'\cf2 \strokec2 ) \{\cb1 \
\cb4         \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 log\cf2 \strokec2 (\cf7 \strokec7 'Status change detected affecting Submitted items, syncing...'\cf2 \strokec2 );\cb1 \
\cb4         \cf6 \strokec6 syncSubmittedSheet\cf2 \strokec2 ();\cb1 \
\cb4     \}\cb1 \
\cb4 \}\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf3 \cb4 \strokec3 /**\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  * Function to manually trigger sync for testing\cf2 \cb1 \strokec2 \
\cf3 \cb4 \strokec3  */\cf2 \cb1 \strokec2 \
\pard\pardeftab720\partightenfactor0
\cf5 \cb4 \strokec5 function\cf2 \strokec2  \cf6 \strokec6 testSubmittedSync\cf2 \strokec2 () \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf2 \cb4     \cf5 \strokec5 try\cf2 \strokec2  \{\cb1 \
\cb4         \cf6 \strokec6 syncSubmittedSheet\cf2 \strokec2 ();\cb1 \
\cb4         \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 log\cf2 \strokec2 (\cf7 \strokec7 'Manual sync completed successfully'\cf2 \strokec2 );\cb1 \
\cb4     \} \cf5 \strokec5 catch\cf2 \strokec2  (\cf6 \strokec6 error\cf2 \strokec2 ) \{\cb1 \
\cb4         \cf6 \strokec6 console\cf2 \strokec2 .\cf6 \strokec6 error\cf2 \strokec2 (\cf7 \strokec7 'Manual sync failed:'\cf2 \strokec2 , \cf6 \strokec6 error\cf2 \strokec2 );\cb1 \
\cb4     \}\cb1 \
\cb4 \}\cb1 \
}