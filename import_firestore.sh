function error {
  echo "\033[1;31m$1\033[0m" >&2
}
function warn {
  echo "\033[0;33m$1\033[0m"
}
function success {
  echo "\033[1;32m$1\033[0m"
}
function info {
  echo "\033[0;34m$1\033[0m"
}

trap 'if [[ $? -eq 1 ]]; then error "Error, check previous logs"; fi' EXIT

isLatest=false
databaseName="latest"

handle_options() {
  usage() {
   echo "\nUsage: $0 [OPTIONS]"
   echo "Options:"
   echo " -l, --latest            Compute and pull the latest data"
   echo " -n NAME, --name=NAME    Specify the name of the database extract"
  }

  has_argument() { [[ ("$1" == *=* && -n ${1#*=}) || ( ! -z "$2" && "$2" != -*)  ]]; }
  extract_argument() { echo "${2:-${1#*=}}"; }

  while [ $# -gt 0 ]; do
    case $1 in
      -h | --help)
        usage
        exit 0
        ;;
      -l | --latest)
        isLatest=true
        ;;
      -n | --name*)
        if ! has_argument $@; then
          error 'Error: Name not specified'
          echo "Usage: $0 $(warn '-n NAME') or $0 $(warn --name=NAME)"
          exit 1
        fi

        databaseName=$(extract_argument $@)
        shift
        ;;
      *)
        error "Error: Invalid option: $1"
        usage
        exit 1
        ;;
    esac
    shift
  done
}

info "Clean local storage rules"
rm -r "./storage.rules"
echo 'rules_version = "2";

// Craft rules based on data in your Firestore database
// allow write: if firestore.get(
//    /databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin;
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
' >> './storage.rules' || warn "Storage rule file could not be created"

handle_options "$@"
# echo $isLatest $databaseName
localPath='./database'
project='dnd5-nextgen'
metadata_file='firebase-export-metadata.json'
collections='ability-scores','alignments','backgrounds','classes','conditions','damage-types','equipment-categories','equipment','feats','features','languages','levels','magic-items','magic-schools','monsters','proficiencies','races','rule-sections','rules','skills','spells','subclasses','subraces','traits','weapon-properties','guides'

info "Clean local database"
rm -r $localPath
mkdir $localPath

if $isLatest; then
  info "Clean remote database"
  gsutil rm -r gs://$project/$databaseName/ || warn "Delete remote database failed"

  info "\nExport remote database"
  gcloud firestore export gs://$project/$databaseName/ --collection-ids=$collections || exit 1
fi

info "\nDownload remote database"
gsutil cp -r gs://$project/$databaseName $localPath || exit 1

info "\nCreate metadata file"
echo '{"version":"'$(date +"%Y-%m-%dT%H:%M:%S")'","firestore":{"path":"'$databaseName'","metadata_file":"'$databaseName'/'$databaseName'.overall_export_metadata"}}' >> "$localPath/$metadata_file" || warn "Metadata file could not be created"
success "Successfully loaded firestore database"

