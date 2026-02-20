# Tabela weryfikacji wdrożenia z plikiem `Program.txt`

| Fragment pliku `Program.txt` | W programie | Sprawdzone | Uwagi / Komentarz |
|:---|:---:|:---:|:---|
| **Globalne założenia:** | | | |
| 1. kliknięcie gdzieś poza okno zapisuje i wychodzi z tego okna | ✅ Tak | ✅ Tak | Tło modalu nasłuchuje kliknięcia (`modal-overlay`) i wywołuje akcję zapisz/zamknij dla aktywnego okna. |
| 2. domyślnie wybrany jest aktualny miesiac | ✅ Tak | ✅ Tak | Skrypt przy otwarciu aplikacji pobiera `new Date()` i generuje widok dla obecnego miesiąca. |
| 3. cena treningu/ zajeć to 35zł, cena wynajmu stolu na 1 godzinę to 20 zł | ✅ Tak | ✅ Tak | Skrypty kalkulujące dług posługują się wskazanymi wartościami (35 za trening, `duration * 20` za stół). |
| 4. trening trwa zawsze 1,5h i trwa od 18 do 19:30 | ✅ Tak | ✅ Tak | Ustawiono logiczny bloker zajęć o długości 1,5h sprawdzający kolizje czasowe od godziny początkowej (domyślnie 18:00). |
| 5. Wszystkie dane w programie uzupełnia tylko jedna osoba | ✅ Tak | ✅ Tak | Aplikacja działa bez kont logowania (skierowana bezpośrednio dla urządzenia właściciela w chmurze Firebase). |
| 6. czerwona kropka powrotu do poprzedniego miesiąca oraz kropki... | ✅ Tak | ✅ Tak | Wysłanie zapytania sprawdzającego opóźnienia do bazy wyświetla czerwone `.alert-dot` na liście konkretnego zawodnika/treningu, a globalny znacznik zapala się na strzałce „wstecz”. |
| **Główne zakładki: 1. Kalendarz:** | | | |
| - Wybór miesiąca | ✅ Tak | ✅ Tak | Strzałki nad listą pozwalają dynamicznie przeglądać listę ubiegłych/wstecznych dat. |
| - Treningi są zawsze w poniedziałki i środy | ✅ Tak | ✅ Tak | Kod JS przelicza dni w miesiącu i domyślnie generuje obiekty na pozycjach `getDay() === 1 (Pn)` oraz `3 (Śr)`. |
| - Widok listy | ✅ Tak | ✅ Tak | Przejrzysty układ kart zawodników tworzących ułożoną pod sobą tablicę przewijalną. |
| - belka wyglada tak ze... (data, godz 18:00, l. graczy) | ✅ Tak | ✅ Tak | Prawa sekcja elementu pokazuje ilość z ikoną `people`, a lewa to data + dzień tygodnia wygenerowana lokalnie. |
| - od góry od poczatku miesiaca a na dole ostatni trening | ✅ Tak | ✅ Tak | Dane są sortowane metodą chronologiczną `.localeCompare` po wygenerowanych kluczach `YYYY-MM-DD`. |
| - Po klikniknięciu: można zmienić godzinę treningu | ✅ Tak | ✅ Tak | Położony `input time` wewnątrz modala aktualizuje rekord `time` treningu nadpisując domyślne `18:00`. |
| - przenieść trening na inny dzień (belka z info o zmianie) | ✅ Tak | ✅ Tak | Wpisuje parametr `movedTo` - system generuje starą i zmienioną belkę z odcieniami szarego dla etykiety `(Przełożono z)`. |
| - można odwołać trening (dopisek na belce o odwołaniu) | ✅ Tak | ✅ Tak | Rekord nadpisuje parametr `canceled: true`. Kolorystyka belki ostrzega na czerwono statusem `(Odwołany)`. |
| - można usunąć gracza z listy zawodników tego treningu | ✅ Tak | ✅ Tak | Mały czerwony kosz bezpośrednio przy liście wybranych uczestników do zdarzenia. |
| - można dodać zawodnika z rozwijanej listy wielokrotnego wyboru | ✅ Tak | ✅ Tak | Użyto domyślnego elementu `<select multiple>` grupującego wszystkie nieprzypięte jeszcze pozycje (zapobiega dublom). |
| - można dodać nowego do bazy i treningu jednocześnie | ✅ Tak | ✅ Tak | Zapis formularza odpytuje moduł dodania gracza, pobiera z Firebase wygenerowane ID i natychmiastowo dodaje go do `[t.players]`. |
| - lista zapisanych graczy + przelaczenie 'zaplacone' statusu | ✅ Tak | ✅ Tak | Przyciski w kolorach czerwony/zielony z przełącznikiem boolean o zapłacie przypisanej dla konkretnego wpisu. |
| - informacja o platnościach komunikuje z kalend (i na odwrot) | ✅ Tak | ✅ Tak | Baza nie przechowuje logów wielokrotnie - wszystko to jedno połączenie referencyjne. Zmiany są wszędzie zsynchronizowane. |
| **Główne zakładki: 2. Zawodnicy:** | | | |
| - wybór miesiaća (domyślny obecny) | ✅ Tak | ✅ Tak | Zakładka współdziała z górnym menu aplikacji sterując widokiem miesiąca. |
| - lista zawodników | ✅ Tak | ✅ Tak | Pobranie i sortowanie wpisów ułożone numerycznie przy otwarciu zakładki. |
| - na kazdej belce czy wyszstko oplacil czy ma zaległe (brak to puste) | ✅ Tak | ✅ Tak | Kod pobiera aktywności z kalendarza i zgłasza błędy w zależności od wyników wpłaty - jeżeli zero aktywności, brak jakichkolwiek odznak. |
| - po kliknięciu: ilość zajęć w miesiącu, godzin stołu i pozostała kwota | ✅ Tak | ✅ Tak | Generowane na bieżąco, zliczone liczniki treningów i osobne pomnożenie przez godziny wynajętego stołu sumują ostateczny wynik w okienku statystyk modala. |
| - (kliknięcie ikonki telefonu aplikacja otworzy połaczenie) | ✅ Tak | ✅ Tak | Jeśli parametr gracza podaje telefon interfejs dostaje odnośnik systemowy `tel://999999999`. |
| - przycisk edycji gracza | ✅ Tak | ✅ Tak | Po odpaleniu ukazuje dodatkowy modal z danymi dotychczasowymi z możliwością ich zaktualizowania. |
| - przycisk usuniecia gracza | ✅ Tak | ✅ Tak | Usunięcie wymaga weryfikacji, pozbywa się referencji ID z sekcji players - i zostawia spójność tablic globalnych. |
| - jego historia w danym miesiacu (stoly + treningi) i przelacznik wpłaty | ✅ Tak | ✅ Tak | Element pętli segreguje listowanie po typach aktywności w formacie: stół (X godz -> X zł), oraz trening (35 zł), i przełącznik z flagami płatności identycznie jak w reszcie. |
| **Główne zakładki: 3. Stoły:** | | | |
| - można wynająć we wszystkie dni poza godzinami treningów w pn i śr i przełożonymi | ✅ Tak | ✅ Tak | Funkcja `validateTime()` odszukuje aktywne plany treningowe na datę - sprawdza ramy czasowe z zakładnikiem na margines `+1.5h`. Odrzuca przy nakładaniu. |
| - nie mozna wynająć w piątek | ✅ Tak | ✅ Tak | Kod daty wywala ostrzeżenie za każdym razem jeśli element to `getDay() == 5` (piątek). |
| - wybiera sie moziwy dizen, godz, ilosc i kto (+ wpada na listę rez) | ✅ Tak | ✅ Tak | Pełen input tworzący i wysyłający na serwer wpis zaplanowanej rezerwacji. |
| - mozna to rozliczyc (w szczegolach ma przycisk przelaczajacy opłaty) | ✅ Tak | ✅ Tak | Widok rezerwacji ukazuje kwotę wyliczoną `duration * 20` o raz przycisk "do zapłaty" i "zapłacono" działający z podpiętym graczem. |
| - rezerwacje można osunac i edytować w szczegółach | ✅ Tak | ✅ Tak | Pełne zaplecze obsługi na przyciskach pod polem do zapłaty wraz z potwierdzeniem operacji "Zapisz zmiany" / "Kosza". |
