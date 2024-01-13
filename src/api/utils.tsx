const myHeaders = new Headers();
myHeaders.append('Accept', 'application/json');

const capitalizeFirstLetter = (stringToCapitilize: string) =>
  stringToCapitilize.charAt(0).toUpperCase() + stringToCapitilize.slice(1);

export async function get(name: string, url: string) {
  const requestOptions: RequestInit = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  const res = await fetch(url, requestOptions);
  if (!res.ok)
    throw new Error(
      `Bad fetch response for ${capitalizeFirstLetter(name)}: (${res.status}) ${res.statusText}`
    );

  return res.json();
}
