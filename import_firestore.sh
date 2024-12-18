project='dnd5-nextgen'
localPath='./database'
databaseName="latest"
metadata_file='firebase-export-metadata.json'
collections='ability-scores','alignments','backgrounds','classes','conditions','damage-types','equipment-categories','equipment','feats','features','languages','levels','magic-items','magic-schools','monsters','proficiencies','races','rule-sections','rules','skills','spells','subclasses','subraces','traits','weapon-properties'

rm -r $localPath
mkdir $localPath
gsutil rm -r gs://$project/$databaseName/
gcloud firestore export gs://$project/$databaseName/ --collection-ids=$collections
gsutil -m cp -r gs://$project/$databaseName $localPath
echo '{"version":"'$(date +"%Y-%m-%dT%H:%M:%S")'","firestore":{"path":"'$databaseName'","metadata_file":"'$databaseName'/'$databaseName'.overall_export_metadata"}}' >> "$localPath/$metadata_file"